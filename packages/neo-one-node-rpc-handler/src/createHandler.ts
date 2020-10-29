import {
  CallReceiptJSON,
  common,
  crypto,
  JSONHelper,
  RelayTransactionResultJSON,
  toJSONVerifyResult,
  toVMStateJSON,
  TransactionJSON,
  TransactionReceiptJSON,
  VerboseTransactionJSON,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Block,
  Blockchain,
  getEndpointConfig,
  NativeContainer,
  Nep5Transfer,
  Nep5TransferKey,
  Node,
  notificationToJSON,
  Signers,
  StackItem,
  stackItemToJSON,
  StorageKey,
  Transaction,
  TransactionState,
} from '@neo-one/node-core';
import { Labels, utils } from '@neo-one/utils';
import { BN } from 'bn.js';
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
  getnep5transfers: 'getnep5transfers',
  getnep5balances: 'getnep5balances',

  // TODO: I want to say both of these can be removed since you can make changes to policy contract storage
  updatesettings: 'updatesettings',
  getsettings: 'getsettings',

  // NEO•ONE
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

const mapToTransfers = ({ key, value }: { readonly key: Nep5TransferKey; readonly value: Nep5Transfer }) => ({
  timestamp: key.timestampMS.toNumber(),
  assethash: common.uInt160ToString(key.assetScriptHash),
  transferaddress: common.uInt160ToString(value.userScriptHash),
  amount: value.amount.toString(),
  blockindex: value.blockIndex,
  transfernotifyindex: key.blockTransferNotificationIndex,
  txhash: common.uInt256ToString(value.txHash),
});

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
      const stack = result.stack.map((item: StackItem) => stackItemToJSON(item, undefined));

      return {
        script: script.toString('hex'),
        state: toVMStateJSON(result.state),
        stack,
        gasconsumed: result.gasConsumed,
        notifications: result.notifications.map(notificationToJSON),
      };
    } catch {
      return {
        script: script.toString('hex'),
        state: toVMStateJSON(result.state),
        stack: 'error: recursive reference',
        gasconsumed: result.gasConsumed,
        notifications: result.notifications.map(notificationToJSON),
      };
    }
  };

  const getTransactionReceiptJSON = (block: Block, value: TransactionState): TransactionReceiptJSON => ({
    blockIndex: value.blockIndex,
    blockHash: JSONHelper.writeUInt256(block.hash),
    blockTime: JSONHelper.writeUInt64(block.timestamp),
    globalIndex: JSONHelper.writeUInt64(new BN(-1)),
    transactionIndex: block.transactions.findIndex((tx) => value.transaction.hash.equals(tx.hash)),
    transactionHash: JSONHelper.writeUInt256(value.transaction.hash),
    confirmations: blockchain.currentBlockIndex - block.index + 1,
  });

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

      let block = await blockchain.getBlock(hashOrIndex);
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
      const hash = await blockchain.getBlockHash(height);

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
    [RPC_METHODS.getrawtransaction]: async (args): Promise<TransactionJSON | VerboseTransactionJSON | string> => {
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
            throw new Error('If you ever see this error something has gone terribly wrong');
          }

          return tx.serializeJSONWithVerboseData({
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
      const hash = JSONHelper.readUInt160(args[0]);
      const state = await blockchain.contracts.tryGet(hash);
      if (state === undefined) {
        return undefined;
      }
      const id = state.id;

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
    [RPC_METHODS.invokefunction]: async (_args) => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokescript]: async (args) => {
      const script = JSONHelper.readBuffer(args[0]);
      const signers = args[1] !== undefined ? Signers.fromJSON(args[1]) : undefined;

      return getInvokeResult(script, signers);
    },
    [RPC_METHODS.getunclaimedgas]: async (args) => {
      const address = args[0];
      if (typeof address !== 'string') {
        throw new JSONRPCError(-100, 'Invalid argument at position 0');
      }
      const scriptHash = crypto.addressToScriptHash({ address, addressVersion: blockchain.settings.addressVersion });
      const isValidAddress = common.isUInt160(scriptHash);
      if (!isValidAddress) {
        throw new JSONRPCError(-100, 'Invalid address');
      }

      const unclaimed = await native.NEO.unclaimedGas(
        { storages: blockchain.storages },
        scriptHash,
        blockchain.currentBlockIndex + 1,
      );

      return {
        unclaimed: unclaimed.toString(),
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
      const scriptHash = JSONHelper.readUInt160(args[0]);
      const address = crypto.scriptHashToAddress({ addressVersion: blockchain.settings.addressVersion, scriptHash });

      const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
      const startTime = args[1] === undefined ? Date.now() - SEVEN_DAYS_IN_MS : args[1];
      const endTime = args[2] === undefined ? Date.now() : args[2];

      if (endTime < startTime) {
        throw new JSONRPCError(-32602, 'Invalid params');
      }

      const startTimeBytes = new BN(startTime, 'le').toBuffer();
      const endTimeBytes = new BN(endTime, 'le').toBuffer();

      const gte = Buffer.concat([scriptHash, startTimeBytes]);
      const lte = Buffer.concat([scriptHash, endTimeBytes]);

      const sentPromise = blockchain.nep5TransfersSent
        .find$(gte, lte)
        .pipe(take(1000), map(mapToTransfers), toArray())
        .toPromise();
      const receivedPromise = blockchain.nep5TransfersSent
        .find$(gte, lte)
        .pipe(take(1000), map(mapToTransfers), toArray())
        .toPromise();

      const [sent, received] = await Promise.all([sentPromise, receivedPromise]);

      return {
        sent,
        received,
        address,
      };
    },
    [RPC_METHODS.getnep5balances]: async (args) => {
      const scriptHash = JSONHelper.readUInt160(args[0]);
      const address = crypto.scriptHashToAddress({ addressVersion: blockchain.settings.addressVersion, scriptHash });
      const storedBalances = await blockchain.nep5Balances.find$(scriptHash).pipe(toArray()).toPromise();
      const validBalances = await Promise.all(
        storedBalances.map(async ({ key, value }) => {
          const assetStillExists = await blockchain.contracts.tryGet(key.assetScriptHash);
          if (!assetStillExists) {
            return undefined;
          }

          return {
            assethash: common.uInt160ToString(key.assetScriptHash),
            amount: value.balance.toString(),
            lastupdatedblock: value.lastUpdatedBlock,
          };
        }),
      );

      return {
        balance: validBalances.filter(utils.notNull),
        address,
      };
    },

    // Settings
    [RPC_METHODS.updatesettings]: async (_args) => {
      throw new JSONRPCError(-101, 'Not implemented');
      // const { settings } = blockchain;
      // const newSettings = {
      //   ...settings,
      //   secondsPerBlock: args[0].secondsPerBlock,
      // };

      // blockchain.updateSettings(newSettings);

      // return true;
    },
    [RPC_METHODS.getsettings]: async () => ({ millisecondsPerBlock: blockchain.settings.millisecondsPerBlock }),

    // NEO•ONE
    [RPC_METHODS.relaytransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const transactionJSON = transaction.serializeJSON();
        const result = await node.relayTransaction(transaction, { forceAdd: true, throwVerifyError: true });

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

        // TODO: client expects more information than this
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
          take(1000),
          map(({ key, value }) => value.serializeJSON(key)),
          toArray(),
        )
        .toPromise();
    },

    [RPC_METHODS.gettransactionreceipt]: async (args): Promise<TransactionReceiptJSON | undefined> => {
      const state = await blockchain.transactions.tryGet(JSONHelper.readUInt256(args[0]));

      let watchTimeoutMS;
      if (args[1] !== undefined && typeof args[1] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      }

      let result;
      if (state === undefined) {
        if (watchTimeoutMS === undefined) {
          throw new JSONRPCError(-100, 'Unknown transaction');
        }

        try {
          result = await blockchain.block$
            .pipe(
              switchMap(async (block) => {
                const data = await blockchain.transactions.tryGet(JSONHelper.readUInt256(args[0]));

                return data === undefined ? undefined : getTransactionReceiptJSON(block, data);
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
        const block = await blockchain.getBlock(state.blockIndex);
        if (block === undefined) {
          throw new Error('For TS');
        }

        result = getTransactionReceiptJSON(block, state);
      }

      return result;
    },

    [RPC_METHODS.getinvocationdata]: async (_args) => {
      throw new JSONRPCError(-101, 'Not implemented');
      // const transactionState = await blockchain.transactions.get(JSONHelper.readUInt256(args[0]));
      // // TODO: check serializeJSON() method. Doesn't include `data`
      // const result = transactionState.transaction.serializeJSONWithInvocationData();

      // if (result.data === undefined) {
      //   throw new JSONRPCError(-103, 'Invalid Transaction');
      // }

      // return result.data;
    },
    [RPC_METHODS.getnetworksettings]: async () => {
      const {
        decrementInterval,
        generationAmount,
        privateKeyVersion,
        standbyValidators,
        messageMagic,
        addressVersion,
        standbyCommittee,
        committeeMembersCount,
        validatorsCount,
        millisecondsPerBlock,
        memoryPoolMaxTransactions,
      } = blockchain.settings;

      return {
        decrementinterval: decrementInterval,
        generationamount: generationAmount,
        privatekeyversion: privateKeyVersion,
        standbydalidators: standbyValidators.map((val) => common.ecPointToString(val)),
        messagemagic: messageMagic,
        addressversion: addressVersion,
        standbycommittee: standbyCommittee.map((val) => common.ecPointToString(val)),
        committeememberscount: committeeMembersCount,
        validatorscount: validatorsCount,
        millisecondsperblock: millisecondsPerBlock,
        memorypoolmaxtransactions: memoryPoolMaxTransactions,
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
