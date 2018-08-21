import {
  Account,
  common,
  crypto,
  deserializeTransactionWire,
  Input,
  InvocationTransaction,
  JSONHelper,
  Transaction,
  TransactionData,
  TransactionJSON,
  TransactionType,
  utils,
} from '@neo-one/client-core';
import { bodyParser, getMonitor } from '@neo-one/http';
import { KnownLabel, metrics, Monitor } from '@neo-one/monitor';
import { Blockchain, getEndpointConfig, Node } from '@neo-one/node-core';
import { Context, Middleware } from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import { filter, switchMap, take, timeout, toArray } from 'rxjs/operators';

export type HandlerPrimitive = string | number | boolean;
export type HandlerResult =
  | object
  | undefined
  | ReadonlyArray<object | HandlerPrimitive>
  | undefined
  | HandlerPrimitive
  | undefined
  | void;
// tslint:disable-next-line no-any
export type Handler = ((args: ReadonlyArray<any>, monitor: Monitor, ctx: Context) => Promise<HandlerResult>);

interface Handlers {
  readonly [method: string]: Handler;
}

interface JSONRPCRequest {
  readonly jsonrpc: '2.0';
  readonly id?: number | undefined;
  readonly method: string;
  readonly params?: ReadonlyArray<object> | object;
}

export class JSONRPCError {
  public readonly code: number;
  public readonly message: string;

  public constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

const RPC_METHODS: { readonly [key: string]: string } = {
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
  getsettings: 'getsettings',
  fastforwardoffset: 'fastforwardoffset',
  fastforwardtotime: 'fastforwardtotime',
  reset: 'reset',
  UNKNOWN: 'UNKNOWN',
  INVALID: 'INVALID',
};

const rpcLabelNames: ReadonlyArray<string> = [KnownLabel.RPC_METHOD];
const rpcLabels = Object.values(RPC_METHODS).map((method) => ({
  [KnownLabel.RPC_METHOD]: method,
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
  // tslint:disable-next-line no-any
  const validateRequest = (_ctx: Context, request: any): JSONRPCRequest => {
    if (
      request !== undefined &&
      typeof request === 'object' &&
      request.jsonrpc === '2.0' &&
      request.method !== undefined &&
      typeof request.method === 'string' &&
      (request.params === undefined || Array.isArray(request.params) || typeof request.params === 'object') &&
      (request.id === undefined || typeof request.id === 'string' || typeof request.id === 'number')
    ) {
      return request;
    }

    throw new JSONRPCError(-32600, 'Invalid Request');
  };

  // tslint:disable-next-line no-any
  const handleSingleRequest = async (monitor: Monitor, ctx: Context, requestIn: any) =>
    monitor.captureSpanLog(
      async (span) => {
        let request;
        try {
          request = validateRequest(ctx, requestIn);
        } finally {
          let method = RPC_METHODS.UNKNOWN;
          if (request !== undefined) {
            ({ method } = request);
          } else if (typeof requestIn === 'object') {
            ({ method } = requestIn);
          }

          if ((RPC_METHODS[method] as string | undefined) === undefined) {
            method = RPC_METHODS.INVALID;
          }

          span.setLabels({ [span.labels.RPC_METHOD]: method });
        }
        const handler = handlers[request.method] as Handler | undefined;
        if (handler === undefined) {
          throw new JSONRPCError(-32601, 'Method not found');
        }

        const { params } = request;
        let handlerParams: ReadonlyArray<object>;
        if (params === undefined) {
          handlerParams = [];
        } else if (Array.isArray(params)) {
          handlerParams = params;
        } else {
          handlerParams = [params];
        }

        const result = await handler(handlerParams, monitor, ctx);

        return {
          jsonrpc: '2.0',
          result,
          id: request.id === undefined ? undefined : request.id,
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

  const handleRequest = (monitor: Monitor, ctx: Context, request: {}) => {
    if (Array.isArray(request)) {
      return Promise.all(request.map(async (batchRequest) => handleSingleRequest(monitor, ctx, batchRequest)));
    }

    return handleSingleRequest(monitor, ctx, request);
  };

  const handleRequestSafe = async (monitor: Monitor, ctx: Context, request: {}): Promise<object | object[]> => {
    try {
      // tslint:disable-next-line prefer-immediate-return
      const result = await monitor.captureSpanLog(async (span) => handleRequest(span, ctx, request), {
        name: 'http_jsonrpc_server_request',
        level: { log: 'verbose', span: 'info' },
        error: {},
      });

      // tslint:disable-next-line no-var-before-return
      return result;
    } catch (error) {
      let errorResponse = {
        code: -32603,
        message: error.message === undefined ? 'Internal error' : error.message,
      };

      if (
        error.code !== undefined &&
        error.message !== undefined &&
        typeof error.code === 'number' &&
        typeof error.message === 'string'
      ) {
        errorResponse = { code: error.code, message: error.message };
      }

      return {
        jsonrpc: '2.0',
        error: errorResponse,
        id: undefined,
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

      // tslint:disable-next-line no-any
      const { fields } = ctx.request as any;
      const monitor = getMonitor(ctx);
      const result = await handleRequestSafe(monitor.withLabels({ [monitor.labels.RPC_TYPE]: 'jsonrpc' }), ctx, fields);

      ctx.body = result;
    },
  ]);
};

const getTransactionReceipt = (value: TransactionData) => ({
  blockIndex: value.startHeight,
  blockHash: JSONHelper.writeUInt256(value.blockHash),
  transactionIndex: value.index,
});

export const rpc = ({ blockchain, node }: { readonly blockchain: Blockchain; readonly node: Node }) => {
  const checkHeight = (height: number) => {
    if (height < 0 && height > blockchain.currentBlockIndex) {
      throw new JSONRPCError(-100, 'Invalid Height');
    }
  };

  const handlers: Handlers = {
    [RPC_METHODS.getaccountstate]: async (args) => {
      const hash = crypto.addressToScriptHash({
        addressVersion: blockchain.settings.addressVersion,
        address: args[0],
      });

      let account = await blockchain.account.tryGet({ hash });
      if (account === undefined) {
        account = new Account({ hash });
      }

      return account.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getassetstate]: async (args) => {
      const asset = await blockchain.asset.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      if (asset === undefined) {
        throw new JSONRPCError(-100, 'Unknown asset');
      }

      return asset.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getbestblockhash]: async () => JSONHelper.writeUInt256(blockchain.currentBlock.hash),
    [RPC_METHODS.getblock]: async (args) => {
      let hashOrIndex = args[0];
      if (typeof args[0] === 'string') {
        hashOrIndex = JSONHelper.readUInt256(args[0]);
      }

      let watchTimeoutMS;
      if (args[1] !== undefined && typeof args[1] === 'number' && args[1] !== 1) {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      } else if (args[2] !== undefined && typeof args[2] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[2];
      }

      let block = await blockchain.block.tryGet({ hashOrIndex });
      if (block === undefined) {
        if (watchTimeoutMS === undefined) {
          throw new JSONRPCError(-100, 'Unknown block');
        }
        try {
          block = await blockchain.block$
            .pipe(
              filter((value) => value.hashHex === args[0] || value.index === args[0]),

              take(1),
              timeout(new Date(Date.now() + watchTimeoutMS)),
            )
            .toPromise();
        } catch {
          throw new JSONRPCError(-100, 'Unknown block');
        }
      }

      if (args[1] === true || args[1] === 1) {
        return block.serializeJSON(blockchain.serializeJSONContext);
      }

      return block.serializeWire().toString('hex');
    },
    [RPC_METHODS.getblockcount]: async () => blockchain.currentBlockIndex + 1,
    [RPC_METHODS.getblockhash]: async (args) => {
      const height = args[0];
      checkHeight(height);
      const block = await blockchain.block.get({ hashOrIndex: height });

      return JSONHelper.writeUInt256(block.hash);
    },
    [RPC_METHODS.getblocksysfee]: async (args) => {
      const height = args[0];
      checkHeight(height);
      const header = await blockchain.header.get({ hashOrIndex: height });
      const blockData = await blockchain.blockData.get({
        hash: header.hash,
      });

      return blockData.systemFee.toString(10);
    },
    [RPC_METHODS.getconnectioncount]: async () => node.connectedPeers.length,
    [RPC_METHODS.getcontractstate]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contract.tryGet({ hash });
      if (contract === undefined) {
        throw new JSONRPCError(-100, 'Unknown contract');
      }

      return contract.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.getrawmempool]: async () =>
      Object.values(node.memPool).map((transaction) => JSONHelper.writeUInt256(transaction.hash)),
    [RPC_METHODS.getrawtransaction]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);

      let transaction = node.memPool[common.uInt256ToHex(hash)] as Transaction | undefined;
      if (transaction === undefined) {
        transaction = await blockchain.transaction.tryGet({ hash });
      }
      if (transaction === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      if (args[1] === true || args[1] === 1) {
        return transaction.serializeJSON(blockchain.serializeJSONContext);
      }

      return transaction.serializeWire().toString('hex');
    },
    [RPC_METHODS.getstorage]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const key = Buffer.from(args[1], 'hex');
      const item = await blockchain.storageItem.tryGet({ hash, key });

      return item === undefined ? undefined : item.value.toString('hex');
    },
    [RPC_METHODS.gettxout]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const [output, spentCoins] = await Promise.all([
        blockchain.output.tryGet({ hash, index }),
        blockchain.transactionData.tryGet({ hash }),
      ]);

      if (spentCoins !== undefined && (spentCoins.endHeights[index] as number | undefined) !== undefined) {
        return undefined;
      }

      return output === undefined ? undefined : output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    [RPC_METHODS.invoke]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokefunction]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokescript]: async (args) => {
      const script = JSONHelper.readBuffer(args[0]);
      const receipt = await blockchain.invokeScript(script);

      return {
        result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
        actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
      };
    },
    [RPC_METHODS.sendrawtransaction]: async (args) => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        await node.relayTransaction(transaction, true);

        return true;
      } catch {
        return false;
      }
    },
    [RPC_METHODS.submitblock]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.validateaddress]: async (args) => {
      let scriptHash;
      try {
        scriptHash = crypto.addressToScriptHash({
          addressVersion: blockchain.settings.addressVersion,
          address: args[0],
        });
      } catch {
        // Ignore errors
      }

      return { address: args[0], isvalid: scriptHash !== undefined };
    },
    [RPC_METHODS.getpeers]: async () => ({
      connected: node.connectedPeers.map((endpoint) => {
        const { host, port } = getEndpointConfig(endpoint);

        return { address: host, port };
      }),
    }),

    // Extended
    [RPC_METHODS.relaytransaction]: async (args) => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const [transactionJSON] = await Promise.all<TransactionJSON, void>([
          transaction.serializeJSON(blockchain.serializeJSONContext),
          node.relayTransaction(transaction, true),
        ]);

        return transactionJSON;
      } catch (error) {
        throw new JSONRPCError(-110, `Relay transaction failed: ${error.message}`);
      }
    },
    [RPC_METHODS.getoutput]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const output = await blockchain.output.tryGet({ hash, index });
      if (output === undefined) {
        throw new JSONRPCError(-100, 'Unknown output');
      }

      return output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    [RPC_METHODS.getclaimamount]: async (args) => {
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
    [RPC_METHODS.getallstorage]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const items = await blockchain.storageItem
        .getAll$({ hash })
        .pipe(toArray())
        .toPromise();

      return items.map((item) => item.serializeJSON(blockchain.serializeJSONContext));
    },
    [RPC_METHODS.testinvocation]: async (args) => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      if (transaction instanceof InvocationTransaction) {
        const receipt = await blockchain.invokeTransaction(transaction);

        return {
          result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
          actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
        };
      }

      throw new JSONRPCError(-103, 'Invalid InvocationTransaction');
    },
    [RPC_METHODS.gettransactionreceipt]: async (args) => {
      const transactionData = await blockchain.transactionData.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      let watchTimeoutMS;
      if (args[1] !== undefined && typeof args[1] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      }

      let result;
      if (transactionData === undefined) {
        if (watchTimeoutMS === undefined) {
          throw new JSONRPCError(-100, 'Unknown transaction');
        }

        try {
          result = await blockchain.block$
            .pipe(
              switchMap(async () => {
                const data = await blockchain.transactionData.tryGet({
                  hash: JSONHelper.readUInt256(args[0]),
                });

                return data === undefined ? undefined : getTransactionReceipt(data);
              }),
              filter((receipt) => receipt !== undefined),
              take(1),
              timeout(new Date(Date.now() + watchTimeoutMS)),
            )
            .toPromise();
        } catch {
          throw new JSONRPCError(-100, 'Unknown transaction');
        }
      } else {
        result = getTransactionReceipt(transactionData);
      }

      return result;
    },
    [RPC_METHODS.getinvocationdata]: async (args) => {
      const transaction = await blockchain.transaction.get({
        hash: JSONHelper.readUInt256(args[0]),
      });

      const result = await transaction.serializeJSON(blockchain.serializeJSONContext);

      if (result.type !== 'InvocationTransaction' || result.invocationData === undefined) {
        throw new JSONRPCError(-103, 'Invalid InvocationTransaction');
      }

      return result.invocationData;
    },
    [RPC_METHODS.getvalidators]: async () => {
      const validators = await blockchain.validator.all$.pipe(toArray()).toPromise();

      return validators.map((validator) => validator.serializeJSON(blockchain.serializeJSONContext));
    },
    [RPC_METHODS.getnetworksettings]: async () => {
      const fee = blockchain.settings.fees[TransactionType.Issue];
      const issueGASFee = common.fixed8ToDecimal(fee === undefined ? utils.ZERO : fee);

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
    [RPC_METHODS.updatesettings]: async (args) => {
      const { settings } = blockchain;
      const newSettings = {
        ...settings,
        secondsPerBlock: args[0].secondsPerBlock,
      };

      blockchain.updateSettings(newSettings);

      return true;
    },
    [RPC_METHODS.getsettings]: async () => ({
      secondsPerBlock: blockchain.settings.secondsPerBlock,
    }),
    [RPC_METHODS.fastforwardoffset]: async (args) => {
      if (node.consensus) {
        await node.consensus.fastForwardOffset(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
    [RPC_METHODS.fastforwardtotime]: async (args) => {
      if (node.consensus !== undefined) {
        await node.consensus.fastForwardToTime(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
    [RPC_METHODS.reset]: async () => {
      if (node.consensus !== undefined) {
        await node.consensus.pause();
      }
      await blockchain.reset();
      if (node.consensus !== undefined) {
        await node.consensus.resume();
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
