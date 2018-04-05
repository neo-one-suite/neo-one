/* @flow */
import type { Context, Middleware } from 'koa';
import {
  TRANSACTION_TYPE,
  type Block,
  Account,
  Input,
  InvocationTransaction,
  JSONHelper,
  common,
  crypto,
  deserializeTransactionWire,
} from '@neo-one/client-core';
import {
  type Blockchain,
  type Node,
  getEndpointConfig,
} from '@neo-one/node-core';
import { LABELS, type Monitor, metrics } from '@neo-one/monitor';

import compose from 'koa-compose';
import compress from 'koa-compress';
import { filter, map, take, timeout, toArray } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import bodyParser from './bodyParser';
import { getMonitor } from './common';

export type HandlerPrimitive = string | number | boolean;

export type HandlerResult =
  | ?Object
  | ?Array<Object | HandlerPrimitive>
  | ?HandlerPrimitive
  | void;
export type Handler = (
  args: Array<any>,
  monitor: Monitor,
  ctx: Context,
) => Promise<HandlerResult>;
type Handlers = { [method: string]: Handler };

type JSONRPCRequest = {
  jsonrpc: '2.0',
  id?: ?number,
  method: string,
  params?: Array<any> | Object,
};

export class JSONRPCError {
  code: number;
  message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

const RPC_METHODS = {
  getaccountstate: 'getaccountstate',
  getassetstate: 'getassetstate',
  getbestblockhash: 'getbestblockhash',
  getblock: 'getblock',
  getblockcount: 'getblockcount',
  getblockhash: 'getblockhash',
  getblocksysfee: 'getblocksysfee',
  getconnectioncount: 'getconnectioncount',
  getcontractstate: 'getcontractstate',
  getrawmempool: 'getrawmempool',
  getrawtransaction: 'getrawtransaction',
  getstorage: 'getstorage',
  gettxout: 'gettxout',
  invoke: 'invoke',
  invokefunction: 'invokefunction',
  invokescript: 'invokescript',
  sendrawtransaction: 'sendrawtransaction',
  submitblock: 'submitblock',
  validateaddress: 'validateaddress',
  getpeers: 'getpeers',
  relaytransaction: 'relaytransaction',
  getoutput: 'getoutput',
  getclaimamount: 'getclaimamount',
  getallstorage: 'getallstorage',
  testinvocation: 'testinvocation',
  gettransactionreceipt: 'gettransactionreceipt',
  getinvocationdata: 'getinvocationdata',
  getvalidators: 'getvalidators',
  getnetworksettings: 'getnetworksettings',
  runconsensusnow: 'runconsensusnow',
  updatesettings: 'updatesettings',
  fastforwardoffset: 'fastforwardoffset',
  fastforwardtotime: 'fastforwardtotime',
  UNKNOWN: 'UNKNOWN',
  INVALID: 'INVALID',
};

const rpcLabelNames = [LABELS.RPC_METHOD];
const rpcLabels = utils.values(RPC_METHODS).map(method => ({
  [LABELS.RPC_METHOD]: method,
}));
const SINGLE_REQUESTS_HISTOGRAM = metrics.createHistogram({
  name: 'http_jsonrpc_server_single_request_duration_seconds',
  labelNames: rpcLabelNames,
  labels: rpcLabels,
});
const SINGLE_REQUEST_ERRORS_COUNTER = metrics.createCounter({
  name: 'http_jsonrpc_server_single_request_failures_total',
  labelNames: rpcLabelNames,
  labels: rpcLabels,
});

const jsonrpc = (handlers: Handlers): Middleware => {
  const validateRequest = (ctx: Context, request: Object): JSONRPCRequest => {
    if (
      request != null &&
      typeof request === 'object' &&
      request.jsonrpc === '2.0' &&
      request.method != null &&
      typeof request.method === 'string' &&
      (request.params == null ||
        Array.isArray(request.params) ||
        typeof request.params === 'object') &&
      (request.id == null ||
        typeof request.id === 'string' ||
        typeof request.id === 'number')
    ) {
      return request;
    }

    throw new JSONRPCError(-32600, 'Invalid Request');
  };

  const handleSingleRequest = async (
    monitor: Monitor,
    ctx: Context,
    requestIn: any,
  ) =>
    monitor.captureSpanLog(
      async span => {
        let request;
        try {
          request = validateRequest(ctx, requestIn);
        } finally {
          let method = RPC_METHODS.UNKNOWN;
          if (request != null) {
            ({ method } = request);
          } else if (typeof requestIn === 'object') {
            ({ method } = requestIn.method);
          }

          if (RPC_METHODS[method] == null) {
            method = RPC_METHODS.INVALID;
          }

          span.setLabels({ [span.labels.RPC_METHOD]: method });
        }
        const handler = handlers[request.method];
        if (handler == null) {
          throw new JSONRPCError(-32601, 'Method not found');
        }

        let { params } = request;
        if (params == null) {
          params = [];
        } else if (!Array.isArray(params)) {
          params = [params];
        }

        const result = await handler(params, monitor, ctx);
        return {
          jsonrpc: '2.0',
          result,
          id: request.id == null ? null : request.id,
        };
      },
      {
        name: 'http_jsonrpc_server_single_request',
        metric: {
          total: SINGLE_REQUESTS_HISTOGRAM,
          error: SINGLE_REQUEST_ERRORS_COUNTER,
        },
        level: { log: 'verbose', span: 'info' },
      },
    );

  const handleRequest = (monitor: Monitor, ctx: Context, request: mixed) => {
    if (Array.isArray(request)) {
      return Promise.all(
        request.map(batchRequest =>
          handleSingleRequest(monitor, ctx, batchRequest),
        ),
      );
    }

    return handleSingleRequest(monitor, ctx, request);
  };

  const handleRequestSafe = async (
    monitor: Monitor,
    ctx: Context,
    request: mixed,
  ): Promise<Object | Array<any>> => {
    try {
      const result = await monitor.captureSpanLog(
        span => handleRequest(span, ctx, request),
        {
          name: 'http_jsonrpc_server_request',
          level: { log: 'verbose', span: 'info' },
        },
      );
      return result;
    } catch (error) {
      let errorResponse = {
        code: -32603,
        message: 'Internal error',
      };
      if (
        error.code != null &&
        error.message != null &&
        typeof error.code === 'number' &&
        typeof error.message === 'string'
      ) {
        errorResponse = { code: error.code, message: error.message };
      }

      return {
        jsonrpc: '2.0',
        error: errorResponse,
        id: null,
      };
    }
  };

  return compose([
    compress(),
    bodyParser(),
    async (ctx: Context): Promise<void> => {
      if (!ctx.is('application/json')) {
        return ctx.throw(415);
      }

      const { fields } = ctx.request;
      const monitor = getMonitor(ctx);
      const result = await handleRequestSafe(
        monitor.withLabels({ [monitor.labels.RPC_TYPE]: 'jsonrpc' }),
        ctx,
        fields,
      );
      ctx.body = result;

      return undefined;
    },
  ]);
};

const getTransactionReceipt = (value: Block, hash: string) => {
  const transactionIndex = value.transactions
    .map(transaction => transaction.hashHex)
    .indexOf(hash);
  if (transactionIndex === -1) {
    return null;
  }

  return {
    blockIndex: value.index,
    blockHash: JSONHelper.writeUInt256(value.hash),
    transactionIndex,
  };
};

export default ({
  blockchain,
  node,
}: {|
  blockchain: Blockchain,
  node: Node,
|}) => {
  const checkHeight = (height: number) => {
    if (height < 0 && height > blockchain.currentBlockIndex) {
      throw new JSONRPCError(-100, 'Invalid Height');
    }
  };

  const handlers = {
    [RPC_METHODS.getaccountstate]: async args => {
      const hash = crypto.addressToScriptHash({
        addressVersion: blockchain.settings.addressVersion,
        address: args[0],
      });
      let account = await blockchain.account.tryGet({ hash });
      if (account == null) {
        account = new Account({ hash });
      }

      return account.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getassetstate]: async args => {
      const asset = await blockchain.asset.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      if (asset == null) {
        throw new JSONRPCError(-100, 'Unknown asset');
      }

      return asset.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getbestblockhash]: async () =>
      JSONHelper.writeUInt256(blockchain.currentBlock.hash),
    [RPC_METHODS.getblock]: async args => {
      let hashOrIndex = args[0];
      if (typeof args[0] === 'string') {
        hashOrIndex = JSONHelper.readUInt256(args[0]);
      }

      let watchTimeoutMS;
      if (args[1] != null && typeof args[1] === 'number' && args[1] !== 1) {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      } else if (args[2] != null && typeof args[2] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[2];
      }

      let block = await blockchain.block.tryGet({ hashOrIndex });
      if (block == null) {
        if (watchTimeoutMS == null) {
          throw new JSONRPCError(-100, 'Unknown block');
        }
        try {
          block = await blockchain.block$
            .pipe(
              filter(
                value => value.hashHex === args[0] || value.index === args[0],
              ),
              take(1),
              timeout(new Date(Date.now() + watchTimeoutMS)),
            )
            .toPromise();
        } catch (error) {
          throw new JSONRPCError(-100, 'Unknown block');
        }
      }

      if (args[1] === true || args[1] === 1) {
        const json = await block.serializeJSON(blockchain.serializeJSONContext);
        return json;
      }

      return block.serializeWire().toString('hex');
    },
    [RPC_METHODS.getblockcount]: async () => blockchain.currentBlockIndex + 1,
    [RPC_METHODS.getblockhash]: async args => {
      const height = args[0];
      checkHeight(height);
      const block = await blockchain.block.get({ hashOrIndex: height });
      return JSONHelper.writeUInt256(block.hash);
    },
    [RPC_METHODS.getblocksysfee]: async args => {
      const height = args[0];
      checkHeight(height);
      const header = await blockchain.header.get({ hashOrIndex: height });
      const blockSystemFee = await blockchain.blockSystemFee.get({
        hash: header.hash,
      });
      return blockSystemFee.systemFee.toString(10);
    },
    [RPC_METHODS.getconnectioncount]: async () => node.connectedPeers.length,
    [RPC_METHODS.getcontractstate]: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contract.tryGet({ hash });
      if (contract == null) {
        throw new JSONRPCError(-100, 'Unknown contract');
      }

      return contract.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getrawmempool]: async () =>
      utils
        .values(node.memPool)
        .map(transaction => JSONHelper.writeUInt256(transaction.hash)),
    [RPC_METHODS.getrawtransaction]: async args => {
      const hash = JSONHelper.readUInt256(args[0]);

      let transaction = node.memPool[common.uInt256ToHex(hash)];
      if (transaction == null) {
        transaction = await blockchain.transaction.tryGet({ hash });
      }
      if (transaction == null) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      if (args[1] === true || args[1] === 1) {
        const json = await transaction.serializeJSON(
          blockchain.serializeJSONContext,
        );
        return json;
      }

      return transaction.serializeWire().toString('hex');
    },
    [RPC_METHODS.getstorage]: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const key = Buffer.from(args[1], 'hex');
      const item = await blockchain.storageItem.tryGet({ hash, key });
      return item == null ? null : item.value.toString('hex');
    },
    [RPC_METHODS.gettxout]: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const [output, spentCoins] = await Promise.all([
        blockchain.output.tryGet({ hash, index }),
        blockchain.transactionSpentCoins.tryGet({ hash }),
      ]);
      if (spentCoins != null && spentCoins.endHeights[index] != null) {
        return null;
      }
      return output == null
        ? null
        : output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    [RPC_METHODS.invoke]: async () => {
      // TODO: Implement me
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokefunction]: async () => {
      // TODO: Implement me
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokescript]: async args => {
      const script = JSONHelper.readBuffer(args[0]);
      const result = await blockchain.invokeScript(script);
      return result.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.sendrawtransaction]: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      try {
        await node.relayTransaction(transaction);
        return true;
      } catch (error) {
        return false;
      }
    },
    [RPC_METHODS.submitblock]: async () => {
      // TODO: Implement me
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.validateaddress]: async args => {
      let scriptHash;
      try {
        scriptHash = crypto.addressToScriptHash({
          addressVersion: blockchain.settings.addressVersion,
          address: args[0],
        });
      } catch (error) {
        // Ignore errors
      }

      return { address: args[0], isvalid: scriptHash != null };
    },
    [RPC_METHODS.getpeers]: async () => ({
      connected: node.connectedPeers.map(endpoint => {
        const { host, port } = getEndpointConfig(endpoint);
        return { address: host, port };
      }),
    }),
    // Extended
    [RPC_METHODS.relaytransaction]: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      try {
        const [transactionJSON] = await Promise.all([
          transaction.serializeJSON(blockchain.serializeJSONContext),
          node.relayTransaction(transaction),
        ]);
        return transactionJSON;
      } catch (error) {
        throw new JSONRPCError(
          -110,
          `Relay transaction failed: ${error.message}`,
        );
      }
    },
    [RPC_METHODS.getoutput]: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const output = await blockchain.output.tryGet({ hash, index });
      if (output == null) {
        throw new JSONRPCError(-100, 'Unknown output');
      }

      return output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    [RPC_METHODS.getclaimamount]: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      try {
        const value = await blockchain.calculateClaimAmount([
          new Input({
            hash,
            index,
          }),
        ]);
        return common.fixed8ToDecimal(value).toString();
      } catch (error) {
        throw new JSONRPCError(-102, error.message);
      }
    },
    [RPC_METHODS.getallstorage]: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const items = await blockchain.storageItem
        .getAll({ hash })
        .pipe(toArray())
        .toPromise();
      return items.map(item =>
        item.serializeJSON(blockchain.serializeJSONContext),
      );
    },
    [RPC_METHODS.testinvocation]: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      if (transaction instanceof InvocationTransaction) {
        const result = await blockchain.invokeTransaction(transaction);
        return result.serializeJSON(blockchain.serializeJSONContext);
      }

      throw new JSONRPCError(-103, 'Invalid InvocationTransaction');
    },
    [RPC_METHODS.gettransactionreceipt]: async args => {
      const spentCoins = await blockchain.transactionSpentCoins.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      let watchTimeoutMS;
      if (args[1] != null && typeof args[1] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      }

      let result;
      if (spentCoins == null) {
        if (watchTimeoutMS == null) {
          throw new JSONRPCError(-100, 'Unknown transaction');
        }

        result = await blockchain.block$
          .pipe(
            map(value => getTransactionReceipt(value, args[0])),
            filter(receipt => receipt != null),
            take(1),
            timeout(new Date(Date.now() + watchTimeoutMS)),
          )
          .toPromise();
      } else {
        const block = await blockchain.block.get({
          hashOrIndex: spentCoins.startHeight,
        });
        result = getTransactionReceipt(block, args[0]);
      }

      return result;
    },
    [RPC_METHODS.getinvocationdata]: async args => {
      const transaction = await blockchain.transaction.get({
        hash: JSONHelper.readUInt256(args[0]),
      });

      const result = await transaction.serializeJSON(
        blockchain.serializeJSONContext,
      );
      if (result.data == null) {
        throw new JSONRPCError(-103, 'Invalid InvocationTransaction');
      }

      return result.data;
    },
    [RPC_METHODS.getvalidators]: async () => {
      const validators = await blockchain.validator.all
        .pipe(toArray())
        .toPromise();
      return validators.map(validator =>
        validator.serializeJSON(blockchain.serializeJSONContext),
      );
    },
    [RPC_METHODS.getnetworksettings]: async () => {
      const issueGASFee = common.fixed8ToDecimal(
        blockchain.settings.fees[TRANSACTION_TYPE.ISSUE],
      );
      return {
        issueGASFee: issueGASFee.toString(),
      };
    },
    [RPC_METHODS.runconsensusnow]: async () => {
      if (node.consensus) {
        await node.consensus.runConsensusNow();
      } else {
        throw new Error('This node does not support triggering consensus.');
      }
      return true;
    },
    [RPC_METHODS.updatesettings]: async args => {
      const { settings } = blockchain;
      const newSettings = {
        ...settings,
        secondsPerBlock: args[0].secondsPerBlock,
      };

      blockchain.updateSettings(newSettings);
      return true;
    },
    [RPC_METHODS.fastforwardoffset]: async args => {
      if (node.consensus) {
        await node.consensus.fastForwardOffset(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
    [RPC_METHODS.fastforwardtotime]: async args => {
      if (node.consensus != null) {
        await node.consensus.fastForwardToTime(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
  };

  return {
    name: 'rpc',
    path: '/rpc',
    middleware: jsonrpc(handlers),
  };
};
