import {
  common,
  crypto,
  JSONHelper,
  RelayTransactionResultJSON,
  toWitnessScope,
  TransactionJSON,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Blockchain,
  getEndpointConfig,
  Node,
  RelayTransactionResult,
  Signer,
  Transaction,
  TransactionData,
} from '@neo-one/node-core';
import { Labels } from '@neo-one/utils';
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
  getbestblockhash: 'getbestblockhash',
  getblock: 'getblock',
  getblockcount: 'getblockcount',
  getblockhash: 'getblockhash',
  getconnectioncount: 'getconnectioncount',
  getcontractstate: 'getcontractstate',
  getrawmempool: 'getrawmempool',
  getrawtransaction: 'getrawtransaction',
  getstorage: 'getstorage',
  invokefunction: 'invokefunction',
  invokescript: 'invokescript',
  sendrawtransaction: 'sendrawtransaction',
  submitblock: 'submitblock',
  validateaddress: 'validateaddress',
  getpeers: 'getpeers',
  relaytransaction: 'relaytransaction',
  relaystrippedtransaction: 'relaystrippedtransaction',
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
  listplugins: 'listplugins',
  gettransactionheight: 'gettransactionheight',
  getversion: 'getversion',
  getapplicationlog: 'getapplicationlog',
  getnep5transfers: 'getnep5transfers', // add to RPCClient?
  getnep5balances: 'getnep5balances', // add to RPCClient?
  getblockheader: 'getblockheader', // add to RPCClient?
  closewallet: 'closewallet',
  dumpprivkey: 'dumpprivkey',
  getnewaddress: 'getnewaddress',
  getunclaimedgas: 'getunclaimedgas',
  getwalletbalance: 'getwalletbalance',
  getwalletunclaimedgas: 'getwalletunclaimedgas',
  importprivkey: 'importprivkey',
  listaddress: 'listaddress',
  openwallet: 'openwallet',
  sendfrom: 'sendfrom',
  sendmany: 'sendmany',
  sendtoaddress: 'sendtoaddress',
  UNKNOWN: 'UNKNOWN',
  INVALID: 'INVALID',
};

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
      logger.debug({ name: 'jsonrpc_server_single_request', ...labels });

      return {
        jsonrpc: '2.0',
        result,
        id: request.id === undefined ? undefined : request.id,
      };
    } catch (err) {
      logger.error({ name: 'jsonrpc_server_single_request', ...labels, err });

      throw err;
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
        logger.debug({ name: 'jsonrpc_server_request', ...labels });
      } catch (err) {
        logger.error({ name: 'jsonrpc_server_request', ...labels, err });
        throw err;
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
      const contract = await blockchain.contract.tryGet({ hash });
      if (contract === undefined) {
        return undefined;
      }
      const id = contract.id;
      const key = Buffer.from(args[1], 'hex');
      const item = await blockchain.storageItem.tryGet({ id, key });

      return item === undefined ? undefined : item.serializeJSON(blockchain.serializeJSONContext);
    },
    [RPC_METHODS.invokefunction]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokescript]: async (args) => {
      // TODO: test this method
      const script = JSONHelper.readBuffer(args[0]);
      const signers = args[1]?.map(
        // tslint:disable-next-line: no-any
        (signer: any) =>
          new Signer({
            account: JSONHelper.readUInt160(signer.account),
            scopes: toWitnessScope(signer?.scopes),
            allowedContracts: signer.allowedcontracts?.map((contract: string) => JSONHelper.readUInt160(contract)),
            allowedGroups: signer.allowedgroups?.map((group: string) => JSONHelper.readECPoint(group)),
          }),
      );
      const receipt = await blockchain.invokeScript(script, signers);

      return {
        result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
        actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
      };
    },
    [RPC_METHODS.sendrawtransaction]: async (args) => {
      const transaction = Transaction.deserializeWire({
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
    [RPC_METHODS.listplugins]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getversion]: async () => {
      const { tcpPort: tcpport, wsPort: wsport, nonce, useragent } = node.version;

      return {
        tcpport,
        wsport,
        nonce,
        useragent,
      };
    },
    [RPC_METHODS.gettransactionheight]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const transaction = await blockchain.transactionData.tryGet({ hash });
      if (transaction === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      return transaction.startHeight;
    },
    [RPC_METHODS.getapplicationlog]: async () => {
      // TODO: this is very similar to our "getinvocationdata"
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getnep5transfers]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
      const startTime = args[1] === undefined ? Date.now() - SEVEN_DAYS_IN_MS : args[1];
      const endTime = args[2] === undefined ? Date.now() : args[2];
      if (endTime < startTime) {
        throw new JSONRPCError(-32602, 'Invalid params');
      }

      // TODO:
      // get all NEP5 transfers either by address or time specified
      // or can get all blocks over the time period
      // then get all transactions from those blocks
      // then filter transactions by address

      // possiblities: TransferData, InvocationData, Account, Transaction, Action

      return {
        sent: [],
        transfersReceived: [],
        address: common.uInt160ToString(hash),
      };
    },
    [RPC_METHODS.getnep5balances]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const account = await blockchain.account.tryGet({ hash });
      if (account === undefined) {
        throw new JSONRPCError(-100, 'Unknown account');
      }
      const resultBalances: Array<{
        readonly assethash: string;
        readonly amount: string;
        readonly lastupdatedblock: number;
      }> = [];
      const balances = Object.entries(account.balances);
      // tslint:disable-next-line: no-loop-statement
      for (const balance of balances) {
        // tslint:disable-next-line: no-array-mutation
        resultBalances.push({
          assethash: balance[0],
          amount: balance[1]?.toString() ?? '0',
          lastupdatedblock: -1, // TODO: in account balance in blockchain.account we need to store the "lastUpdateBlock" as well
        });
      }

      return {
        balance: resultBalances,
        address: common.uInt160ToString(hash),
      };
    },
    [RPC_METHODS.getblockheader]: async (args) => {
      let hashOrIndex = args[0];
      if (typeof args[0] === 'string') {
        hashOrIndex = JSONHelper.readUInt256(args[0]);
      }

      const header = await blockchain.header.tryGet({ hashOrIndex });
      if (header === undefined) {
        throw new JSONRPCError(-100, 'Unknown block');
      }

      return header.serializeWire().toString('hex');
    },
    [RPC_METHODS.getunclaimedgas]: async (args) => {
      const address = JSONHelper.readUInt160(args[0]);
      const isValidAddress = common.isUInt160(address);
      if (!isValidAddress) {
        throw new JSONRPCError(-100, 'Invalid address');
      }

      // TODO: implement native contracts in blockchain for getting unclaimed gas
      // const unclaimed = await blockchain.getUnclaimedGas(address);
      // result = unclaimed.toString();

      return {
        unclaimed: '0', // TODO: replace
        address: JSONHelper.writeUInt160(address),
      };
    },
    [RPC_METHODS.closewallet]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.dumpprivkey]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getnewaddress]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getwalletbalance]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getwalletunclaimedgas]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.importprivkey]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.listaddress]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.openwallet]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.sendfrom]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.sendmany]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.sendtoaddress]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },

    // Extended
    [RPC_METHODS.relaytransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const transaction = Transaction.deserializeWire({
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
    [RPC_METHODS.relaystrippedtransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const verificationTransaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      const relayTransaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[1]),
      });

      try {
        const [transactionJSON, result] = await Promise.all<TransactionJSON, RelayTransactionResult>([
          relayTransaction.serializeJSON(blockchain.serializeJSONContext),
          node.relayStrippedTransaction(verificationTransaction, relayTransaction, {
            forceAdd: true,
            throwVerifyError: true,
          }),
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
    [RPC_METHODS.getallstorage]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contract.tryGet({ hash });
      if (contract === undefined) {
        return [];
      }
      const items = await blockchain.storageItem.getAll$({ id: contract.id }).pipe(toArray()).toPromise();

      return items.map((item) => item.serializeJSON(blockchain.serializeJSONContext));
    },
    [RPC_METHODS.testinvocation]: async (args) => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const receipt = await blockchain.invokeTransaction(transaction);

        return {
          result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
          actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
        };
      } catch {
        throw new JSONRPCError(-103, 'Invalid Transaction');
      }
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

      const result = await transaction.serializeJSONWithInvocationData(blockchain.serializeJSONContext);

      if (result.invocationData === undefined) {
        throw new JSONRPCError(-103, 'Invalid Transaction');
      }

      return result.invocationData;
    },
    [RPC_METHODS.getvalidators]: async () => {
      // TODO: implement with NativeContract.NEO
      // blockchain.getValidators()

      const validators = await blockchain.validator.all$.pipe(toArray()).toPromise();

      return validators.map((validator) => validator.serializeJSON(blockchain.serializeJSONContext));
    },
    [RPC_METHODS.getnetworksettings]: async () => {
      const settings = blockchain.settings;
      // TODO: change blockchain.settings to be set from NativeContracts
      // Update returned values. Don't have to return all the below values
      // Unique to NEO•ONE

      return {
        maxTransactionPerBlock: 512,
        blockAccounts: [],
        maxBlockSize: 1024 * 256,
        maxBlockSystemFee: '',
        neoVotersCount: 0,
        neoNextBlockValidators: [],
        neoCandidates: [],
        neoCommitteeMembers: [],
        neoCommitteeAddress: '',
        neoTotalSupply: 100000000,
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
