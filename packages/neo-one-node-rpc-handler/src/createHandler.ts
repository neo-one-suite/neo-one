import {
  assertVMStateJSON,
  CallReceiptJSON,
  common,
  crypto,
  JSONHelper,
  RelayTransactionResultJSON,
  ScriptBuilder,
  toJSONVerifyResult,
  toVMStateJSON,
  toWitnessScope,
  TransactionJSON,
  VMState,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Blockchain,
  getEndpointConfig,
  NativeContainer,
  Node,
  RelayTransactionResult,
  Signer,
  Signers,
  stackItemToJSON,
  StorageKey,
  Transaction,
  TransactionData,
  TransactionState,
} from '@neo-one/node-core';
import { Labels } from '@neo-one/utils';
import { filter, map, switchMap, take, timeout, toArray } from 'rxjs/operators';

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
  // Blockchain
  getbestblockhash: 'getbestblockhash',
  getblock: 'getblock',
  getblockcount: 'getblockcount',
  getblockhash: 'getblockhash',
  getblockheader: 'getblockheader',
  getcontractstate: 'getcontractstate',
  getrawmempool: 'getrawmempool',
  getrawtransaction: 'getrawtransaction',
  getstorage: 'getstorage',
  getvalidators: 'getvalidators',
  gettransactionheight: 'gettransactionheight',

  // Node
  getconnectioncount: 'getconnectioncount',
  getpeers: 'getpeers',
  getversion: 'getversion',
  sendrawtransaction: 'sendrawtransaction',
  submitblock: 'submitblock',

  // SmartContract
  invokefunction: 'invokefunction',
  invokescript: 'invokescript',
  getunclaimedgas: 'getunclaimedgas',

  // Utilities
  listplugins: 'listplugins',
  validateaddress: 'validateaddress',
  getapplicationlog: 'getapplicationlog',

  // Wallet
  closewallet: 'closewallet',
  dumpprivkey: 'dumpprivkey',
  getnewaddress: 'getnewaddress',
  getwalletbalance: 'getwalletbalance',
  getwalletunclaimedgas: 'getwalletunclaimedgas',
  importprivkey: 'importprivkey',
  listaddress: 'listaddress',
  openwallet: 'openwallet',
  sendfrom: 'sendfrom',
  sendmany: 'sendmany',
  sendtoaddress: 'sendtoaddress',

  // NEP5
  getnep5transfers: 'getnep5transfers', // add to RPCClient?
  getnep5balances: 'getnep5balances', // add to RPCClient?

  // I want to say both of these can be removed since you can make changes to policy contract storage
  updatesettings: 'updatesettings',
  getsettings: 'getsettings',

  // NEO•ONE
  testinvocation: 'testinvocation',
  relaytransaction: 'relaytransaction',
  getallstorage: 'getallstorage',
  gettransactionreceipt: 'gettransactionreceipt',
  getinvocationdata: 'getinvocationdata',
  getnetworksettings: 'getnetworksettings',
  runconsensusnow: 'runconsensusnow',
  fastforwardoffset: 'fastforwardoffset',
  fastforwardtotime: 'fastforwardtotime',
  reset: 'reset',
  getneotrackerurl: 'getneotrackerurl',
  resetproject: 'resetproject',
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
  native,
  node,
  handleGetNEOTrackerURL,
  handleResetProject,
}: {
  readonly blockchain: Blockchain;
  readonly native: NativeContainer;
  readonly node: Node;
  readonly handleGetNEOTrackerURL: () => Promise<string | undefined>;
  readonly handleResetProject: () => Promise<void>;
}): RPCHandler => {
  const checkHeight = (height: number) => {
    if (height < 0 || height > blockchain.currentBlockIndex) {
      throw new JSONRPCError(-100, 'Invalid Height');
    }
  };

  const getInvokeResult = (script: Buffer, signers?: Signers): CallReceiptJSON => {
    const result = blockchain.invokeScript(script, signers);

    try {
      const stack = result.stack.map((item) => stackItemToJSON(item, undefined));

      return {
        script: script.toString('hex'),
        state: toVMStateJSON(result.state),
        stack,
        gasConsumed: result.gasConsumed.toString(),
      };
    } catch {
      return {
        script: script.toString('hex'),
        state: toVMStateJSON(result.state),
        stack: 'error: recursive reference',
        gasConsumed: result.gasConsumed.toString(),
      };
    }
  };

  const handlers: Handlers = {
    // Blockchain
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

      const trimmedBlock = await blockchain.blocks.tryGet({ hashOrIndex });
      let block = await trimmedBlock?.getBlock(blockchain.transactions);
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
      const hash = blockchain.getBlockHash(height);

      return hash === undefined ? undefined : JSONHelper.writeUInt256(hash);
    },

    [RPC_METHODS.getblockheader]: async (args) => {
      let hashOrIndex = args[0];
      if (typeof args[0] === 'string') {
        hashOrIndex = JSONHelper.readUInt256(args[0]);
      }

      const verbose = args.length >= 2 ? !!args[1] : false;

      const header = await blockchain.getHeader(hashOrIndex);
      if (header === undefined) {
        throw new JSONRPCError(-100, 'Unknown block');
      }

      if (verbose) {
        const confirmations = blockchain.currentBlockIndex - header.index + 1;
        const hash = await blockchain.getNextBlockHash(header.hash);
        const nextblockhash = hash ? JSONHelper.writeUInt256(hash) : undefined;

        return header.serializeJSONVerbose(blockchain.serializeJSONContext, { confirmations, nextblockhash });
      }

      return header.serializeWire().toString('hex');
    },
    [RPC_METHODS.getcontractstate]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contracts.tryGet(hash);
      if (contract === undefined) {
        throw new JSONRPCError(-100, 'Unknown contract');
      }

      return contract.serializeJSON();
    },
    [RPC_METHODS.getrawmempool]: async () => ({
      height: blockchain.currentBlockIndex,
      verified: Object.values(node.memPool).map((transaction) => JSONHelper.writeUInt256(transaction.hash)),
    }),
    [RPC_METHODS.getrawtransaction]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const verbose = args.length >= 2 && !!args[1];

      let tx = node.memPool[common.uInt256ToHex(hash)] as Transaction | undefined;
      let state: TransactionState | undefined;
      if (tx === undefined || verbose) {
        state = await blockchain.transactions.tryGet(hash);
        tx = tx ?? state?.transaction;
      }

      if (tx === undefined) {
        throw new JSONRPCError(-100, 'Unknown Transaction');
      }

      if (verbose) {
        if (state !== undefined) {
          const header = await blockchain.getHeader(state.blockIndex);
          if (header === undefined) {
            // TODO: implement better error;
            throw new Error('If you ever see this error something has gone terribly wrong');
          }

          return tx.serializeJSONWithInvocationData({
            blockhash: JSONHelper.writeUInt256(header.hash),
            confirmations: blockchain.currentBlockIndex - header.index + 1,
            blocktime: JSONHelper.writeUInt64LE(header.timestamp),
            vmstate: toVMStateJSON(state.state),
          });
        }

        return tx.serializeJSON();
      }

      return JSONHelper.writeBuffer(tx.serializeWire());
    },
    [RPC_METHODS.getstorage]: async (args) => {
      let id = 0;
      try {
        const hash = JSONHelper.readUInt160(args[0]);
        const state = await blockchain.contracts.tryGet(hash);
        if (state === undefined) {
          return undefined;
        }
        id = state.id;
      } catch {
        /* do nothing */
      }

      const key = JSONHelper.readBuffer(args[1]);
      const item = await blockchain.storages.tryGet(new StorageKey({ id, key }));

      if (item === undefined) {
        return undefined;
      }

      return JSONHelper.writeBuffer(item.value);
    },
    [RPC_METHODS.getvalidators]: async () => {
      const [validators, candidates] = await Promise.all([
        native.NEO.getValidators({ storages: blockchain.storages }),
        native.NEO.getCandidates({ storages: blockchain.storages }),
      ]);

      return candidates.map((candidate) => ({
        publicKey: JSONHelper.writeECPoint(candidate.publicKey),
        votes: candidate.votes.toString(),
        active: validators.some((validator) => validator.compare(candidate.publicKey) === 0),
      }));
    },
    [RPC_METHODS.gettransactionheight]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const state = await blockchain.transactions.tryGet(hash);
      if (state === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      return state.blockIndex;
    },

    // Node
    [RPC_METHODS.getconnectioncount]: async () => node.connectedPeers.length,
    [RPC_METHODS.getpeers]: async () => ({
      connected: node.connectedPeers.map((endpoint) => {
        const { host, port } = getEndpointConfig(endpoint);

        return { address: host, port };
      }),
    }),
    [RPC_METHODS.getversion]: async () => {
      const { tcpPort: tcpport, wsPort: wsport, nonce, useragent } = node.version;

      return {
        tcpport,
        wsport,
        nonce,
        useragent,
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

    // SmartContract
    // TODO: we didn't use invokefunction in the past, whether or not that will still be the case is up in the air
    [RPC_METHODS.invokefunction]: async (args) => {
      throw new Error('not implemented');
      // const scriptHash = JSONHelper.readUInt160(args[0]);
      // const operation = args[1];
      // const params = args.length >= 3 ? args[2].map((arg) => ContractParameter.fromJSON(arg)) : [];
      // const signers = args.length >= 4 ? signersFromJSON(args[3]) : undefined;
      // const builder = new ScriptBuilder();
      // const script = builder.emitAppCall(scriptHash, operation, params).build();

      // return getInvokeResult(script, signers);
    },
    [RPC_METHODS.invokescript]: async (args) => {
      const script = JSONHelper.readBuffer(args[0]);
      const signers = args[1] !== undefined ? Signers.fromJSON(args[1]) : undefined;

      return getInvokeResult(script, signers);
    },
    [RPC_METHODS.getunclaimedgas]: async (args) => {
      const address = args[0];
      const scriptHash = crypto.addressToScriptHash(address);
      const isValidAddress = common.isUInt160(scriptHash);
      if (!isValidAddress) {
        throw new JSONRPCError(-100, 'Invalid address');
      }

      const unclaimed = await native.NEO.unclaimedGas(
        { storages: blockchain.storages },
        address,
        blockchain.currentBlockIndex + 1,
      );

      return {
        unclaimed,
        address: JSONHelper.writeUInt160(address),
      };
    },
    // Utilities
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

    [RPC_METHODS.listplugins]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getapplicationlog]: async () => {
      // TODO: this is very similar to our "getinvocationdata"
      throw new JSONRPCError(-101, 'Not implemented');
    },

    // Wallet
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

    // Nep5
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
    // [RPC_METHODS.getnep5balances]: async (args) => {
    //   const hash = JSONHelper.readUInt160(args[0]);
    //   const account = await blockchain.account.tryGet({ hash });
    //   if (account === undefined) {
    //     throw new JSONRPCError(-100, 'Unknown account');
    //   }
    //   const resultBalances: Array<{
    //     readonly assethash: string;
    //     readonly amount: string;
    //     readonly lastupdatedblock: number;
    //   }> = [];
    //   const balances = Object.entries(account.balances);
    //   // tslint:disable-next-line: no-loop-statement
    //   for (const balance of balances) {
    //     // tslint:disable-next-line: no-array-mutation
    //     resultBalances.push({
    //       assethash: balance[0],
    //       amount: balance[1]?.toString() ?? '0',
    //       lastupdatedblock: -1, // TODO: in account balance in blockchain.account we need to store the "lastUpdateBlock" as well
    //     });
    //   }

    //   return {
    //     balance: resultBalances,
    //     address: common.uInt160ToString(hash),
    //   };
    // },

    // Settings
    // [RPC_METHODS.updatesettings]: async (args) => {
    //   const { settings } = blockchain;
    //   const newSettings = {
    //     ...settings,
    //     secondsPerBlock: args[0].secondsPerBlock,
    //   };

    //   blockchain.updateSettings(newSettings);

    //   return true;
    // },
    // [RPC_METHODS.getsettings]: async () => ({
    //   millisecondsPerBlock: blockchain.settings.millisecondsPerBlock,
    // }),

    // NEO•ONE
    // TODO: I think we can get away with not using this but we need to make the change in the provider
    // [RPC_METHODS.testinvocation]: async (args) => {
    //   const transaction = Transaction.deserializeWire({
    //     context: blockchain.deserializeWireContext,
    //     buffer: JSONHelper.readBuffer(args[0]),
    //   });

    //   try {
    //     const receipt = blockchain.invokeTransaction(transaction);

    //     return {
    //       result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
    //       actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
    //     };
    //   } catch {
    //     throw new JSONRPCError(-103, 'Invalid Transaction');
    //   }
    // },
    [RPC_METHODS.relaytransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const [transactionJSON, result] = await Promise.all<TransactionJSON, RelayTransactionResult>([
          transaction.serializeJSON(),
          node.relayTransaction(transaction, { forceAdd: true, throwVerifyError: true }),
        ]);

        const resultJSON = result.verifyResult !== undefined ? toJSONVerifyResult(result.verifyResult) : undefined;

        // const resultJSON =
        //   result.verifyResult === undefined
        //     ? {}
        //     : {
        //         verifyResult: {
        //           verifications: result.verifyResult.verifications.map((verification) => ({
        //             hash: JSONHelper.writeUInt160(verification.hash),
        //             witness: verification.witness.serializeJSON(blockchain.serializeJSONContext),
        //             actions: verification.actions.map((action) =>
        //               action.serializeJSON(blockchain.serializeJSONContext),
        //             ),
        //             failureMessage: verification.failureMessage,
        //           })),
        //         },
        //       };

        return {
          transaction: transactionJSON,
          verifyResult: resultJSON,
        };
      } catch (error) {
        throw new JSONRPCError(-110, `Relay transaction failed: ${error.message}`);
      }
    },
    [RPC_METHODS.getallstorage]: async (args) => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contracts.tryGet(hash);
      if (contract === undefined) {
        return [];
      }

      return blockchain.storages
        .find$(Buffer.from([contract.id]))
        .pipe(
          map(({ key, value }) => value.serializeJSON(key)),
          toArray(),
        )
        .toPromise();
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
