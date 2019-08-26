import { common, crypto, JSONHelper, RelayTransactionResultJSON, TransactionJSON, utils } from '@neo-one/client-common';
import { AggregationType, globalStats, MeasureUnit, TagMap } from '@neo-one/client-switch';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Account,
  Blockchain,
  deserializeTransactionWire,
  getEndpointConfig,
  Input,
  InvocationTransaction,
  Node,
  RelayTransactionResult,
  Transaction,
  TransactionData,
  TransactionType,
} from '@neo-one/node-core';
import { Labels, labelToTag } from '@neo-one/utils';
import { filter, switchMap, take, timeout, toArray } from 'rxjs/operators';

const logger = createChild(nodeLogger, { component: 'rpc-handler' });

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
export type Handler = (args: readonly any[]) => Promise<HandlerResult>;

interface Handlers {
  readonly [method: string]: Handler;
}

interface JSONRPCRequest {
  readonly jsonrpc: '2.0';
  readonly id?: number | undefined;
  readonly method: string;
  readonly params?: readonly object[] | object;
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
  getneotrackerurl: 'getneotrackerurl',
  resetproject: 'resetproject',
  UNKNOWN: 'UNKNOWN',
  INVALID: 'INVALID',
};

const rpcTag = labelToTag(Labels.RPC_METHOD);

const requestDurations = globalStats.createMeasureDouble('request/duration', MeasureUnit.MS);
const requestErrors = globalStats.createMeasureInt64('request/failures', MeasureUnit.UNIT);

const SINGLE_REQUESTS_HISTOGRAM = globalStats.createView(
  'jsonrpc_server_single_request_duration_ms',
  requestDurations,
  AggregationType.DISTRIBUTION,
  [rpcTag],
  'distribution of request durations',
  [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
);
globalStats.registerView(SINGLE_REQUESTS_HISTOGRAM);

const SINGLE_REQUEST_ERRORS_COUNTER = globalStats.createView(
  'jsonrpc_server_single_request_failures_total',
  requestErrors,
  AggregationType.COUNT,
  [rpcTag],
  'total number of request errors',
);
globalStats.registerView(SINGLE_REQUEST_ERRORS_COUNTER);

const createJSONRPCHandler = (handlers: Handlers) => {
  // tslint:disable-next-line no-any
  const validateRequest = (request: any): JSONRPCRequest => {
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
  const handleSingleRequest = async (requestIn: any) => {
    const startTime = Date.now();
    let labels = {};
    let method = RPC_METHODS.UNKNOWN;
    try {
      let request;
      try {
        request = validateRequest(requestIn);
      } finally {
        if (request !== undefined) {
          ({ method } = request);
        } else if (typeof requestIn === 'object') {
          ({ method } = requestIn);
        }

        if ((RPC_METHODS[method] as string | undefined) === undefined) {
          method = RPC_METHODS.INVALID;
        }

        labels = { [Labels.RPC_METHOD]: method };
      }
      const handler = handlers[request.method] as Handler | undefined;
      if (handler === undefined) {
        throw new JSONRPCError(-32601, 'Method not found');
      }

      const { params } = request;
      let handlerParams: readonly object[];
      if (params === undefined) {
        handlerParams = [];
      } else if (Array.isArray(params)) {
        handlerParams = params;
      } else {
        handlerParams = [params];
      }

      const result = await handler(handlerParams);
      logger.debug({ title: 'jsonrpc_server_single_request', ...labels });

      globalStats.record([
        {
          measure: requestDurations,
          value: Date.now() - startTime,
        },
      ]);

      return {
        jsonrpc: '2.0',
        result,
        id: request.id === undefined ? undefined : request.id,
      };
    } catch (error) {
      logger.error({ title: 'jsonrpc_server_single_request', ...labels, error: error.message });
      const tags = new TagMap();
      tags.set(rpcTag, { value: method });
      globalStats.record(
        [
          {
            measure: requestErrors,
            value: 1,
          },
        ],
        tags,
      );

      throw error;
    }
  };

  const handleRequest = async (request: unknown) => {
    if (Array.isArray(request)) {
      return Promise.all(request.map(async (batchRequest) => handleSingleRequest(batchRequest)));
    }

    return handleSingleRequest(request);
  };

  const handleRequestSafe = async (
    labels: Record<string, string>,
    request: unknown,
  ): Promise<object | readonly object[]> => {
    try {
      // tslint:disable-next-line: no-any
      let result: any;
      try {
        result = await handleRequest(request);
        logger.debug({ title: 'jsonrpc_server_request', ...labels });
      } catch (error) {
        logger.error({ title: 'jsonrpc_server_request', ...labels, error });
        throw error;
      }

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

  return async (request: unknown) => handleRequestSafe({ [Labels.RPC_TYPE]: 'jsonrpc' }, request);
};

const getTransactionReceipt = (value: TransactionData) => ({
  blockIndex: value.startHeight,
  blockHash: JSONHelper.writeUInt256(value.blockHash),
  transactionIndex: value.index,
  globalIndex: JSONHelper.writeUInt64(value.globalIndex),
});

// tslint:disable-next-line no-any
export type RPCHandler = (request: unknown) => Promise<any>;

export const createHandler = ({
  blockchain,
  node,
  handleGetNEOTrackerURL,
  handleResetProject,
}: {
  readonly blockchain: Blockchain;
  readonly node: Node;
  readonly handleGetNEOTrackerURL: () => Promise<string | undefined>;
  readonly handleResetProject: () => Promise<void>;
}): RPCHandler => {
  const checkHeight = (height: number) => {
    if (height < 0 || height > blockchain.currentBlockIndex) {
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
        await node.relayTransaction(transaction, { throwVerifyError: true, forceAdd: true });

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
    [RPC_METHODS.relaytransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const [transactionJSON, result] = await Promise.all<TransactionJSON, RelayTransactionResult>([
          transaction.serializeJSON(blockchain.serializeJSONContext),
          node.relayTransaction(transaction, { forceAdd: true, throwVerifyError: true }),
        ]);
        const resultJSON =
          result.verifyResult === undefined
            ? {}
            : {
                verifyResult: {
                  verifications: result.verifyResult.verifications.map((verification) => ({
                    hash: JSONHelper.writeUInt160(verification.hash),
                    witness: verification.witness.serializeJSON(blockchain.serializeJSONContext),
                    actions: verification.actions.map((action) =>
                      action.serializeJSON(blockchain.serializeJSONContext),
                    ),
                    failureMessage: verification.failureMessage,
                  })),
                },
              };

        return {
          ...resultJSON,
          transaction: transactionJSON,
        };
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
        await node.consensus.reset();
      }
      await node.reset();
      await blockchain.reset();
      if (node.consensus !== undefined) {
        await node.consensus.resume();
      }

      return true;
    },
    [RPC_METHODS.getneotrackerurl]: async () => handleGetNEOTrackerURL(),
    [RPC_METHODS.resetproject]: async () => {
      await handleResetProject();

      return true;
    },
  };

  return createJSONRPCHandler(handlers);
};
