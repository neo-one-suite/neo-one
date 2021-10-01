import {
  ApplicationLogJSON,
  assertTriggerTypeJSON,
  BinaryWriter,
  BlockJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransactionJSON,
  ContractJSON,
  crypto,
  HeaderJSON,
  JSONHelper,
  NativeContractJSON,
  Nep17BalancesJSON,
  Nep17TransfersJSON,
  Nep17TransferSource,
  NetworkSettingsJSON,
  Peer,
  PrivateNetworkSettings,
  RelayTransactionResultJSON,
  scriptHashToAddress,
  SendRawTransactionResultJSON,
  StorageItemJSON,
  toVerifyResultJSON,
  toVMStateJSON,
  TransactionDataJSON,
  TransactionJSON,
  TransactionReceiptJSON,
  TriggerTypeJSON,
  UInt256,
  UnclaimedGASJSON,
  ValidateAddressJSON,
  ValidatorJSON,
  VerificationCostJSON,
  VerifyResultModel,
  VerifyResultModelExtended,
  VersionJSON,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Block,
  Blockchain,
  getEndpointConfig,
  NativeContainer,
  Nep17Transfer,
  Nep17TransferKey,
  Node,
  Signers,
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
  getblockheadercount: 'getblockheadercount',
  getblockhash: 'getblockhash',
  getblockheader: 'getblockheader',
  getcontractstate: 'getcontractstate',
  getrawmempool: 'getrawmempool',
  getrawtransaction: 'getrawtransaction',
  getstorage: 'getstorage',
  getnextblockvalidators: 'getnextblockvalidators',
  gettransactionheight: 'gettransactionheight',

  // Node
  getconnectioncount: 'getconnectioncount',
  getpeers: 'getpeers',
  getversion: 'getversion',
  sendrawtransaction: 'sendrawtransaction',
  submitblock: 'submitblock',
  getcommittee: 'getcommittee',
  getnativecontracts: 'getnativecontracts',

  // SmartContract
  invokefunction: 'invokefunction',
  invokescript: 'invokescript',
  getunclaimedgas: 'getunclaimedgas',
  testtransaction: 'testtransaction',

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
  calculatenetworkfee: 'calculatenetworkfee',
  invokecontractverify: 'invokecontractverify',
  openwallet: 'openwallet',
  sendfrom: 'sendfrom',
  sendmany: 'sendmany',
  sendtoaddress: 'sendtoaddress',

  // NEP17
  getnep17transfers: 'getnep17transfers',
  getnep17balances: 'getnep17balances',

  // Settings
  updatesettings: 'updatesettings',
  getsettings: 'getsettings',

  // NEO•ONE
  gettransactiondata: 'gettransactiondata',
  getfeeperbyte: 'getfeeperbyte',
  getexecfeefactor: 'getexecfeefactor',
  getverificationcost: 'getverificationcost',
  relaytransaction: 'relaytransaction',
  getallstorage: 'getallstorage',
  gettransactionreceipt: 'gettransactionreceipt',
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

const mapToTransfers = ({ key, value }: { readonly key: Nep17TransferKey; readonly value: Nep17Transfer }) => ({
  timestamp: key.timestampMS.toNumber(),
  assethash: common.uInt160ToString(key.assetScriptHash),
  transferaddress: value.userScriptHash.equals(common.ZERO_UINT160)
    ? // tslint:disable-next-line: no-null-keyword
      null
    : scriptHashToAddress(common.uInt160ToString(value.userScriptHash)),
  amount: value.amount.toString(),
  blockindex: value.blockIndex,
  transfernotifyindex: key.blockTransferNotificationIndex,
  txhash: common.uInt256ToString(value.txHash),
  source: value.source === Nep17TransferSource.Block ? 'Block' : 'Transaction',
  state: toVMStateJSON(value.state),
});

const getScriptHashAndAddress = (param: string, addressVersion: number) => {
  if (param.length < 40) {
    return { address: param, scriptHash: crypto.addressToScriptHash({ addressVersion, address: param }) };
  }
  const scriptHash = JSONHelper.readUInt160(param);

  return { scriptHash, address: crypto.scriptHashToAddress({ addressVersion, scriptHash }) };
};

const getVerifyResultErrorMessage = (extendedResult?: VerifyResultModelExtended) => {
  if (extendedResult !== undefined && extendedResult.verifyResult !== undefined) {
    return `Verification failed: ${extendedResult.verifyResult}${
      extendedResult.failureReason === undefined ? '.' : `: ${extendedResult.failureReason}`
    }`;
  }

  return 'Verification failed.';
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
  const checkHeight = async (height: number) => {
    if (height < 0 || height > (await blockchain.getCurrentIndex())) {
      throw new JSONRPCError(-100, 'Invalid Height');
    }
  };

  const toScriptHash = (input: string) => {
    const keyword = input.toLowerCase();
    // tslint:disable-next-line: no-loop-statement
    for (const nat of native.nativeContracts) {
      if (keyword === nat.name || keyword === nat.id.toString()) {
        return nat.hash;
      }
    }

    return JSONHelper.readUInt160(input);
  };

  const getTransactionReceiptJSON = (block: Block, value: TransactionState): TransactionReceiptJSON => ({
    blockIndex: value.blockIndex,
    blockHash: JSONHelper.writeUInt256(block.hash),
    globalIndex: JSONHelper.writeUInt64(new BN(-1)),
    transactionIndex: block.transactions.findIndex((tx) => value.transaction.hash.equals(tx.hash)),
  });

  const handlers: Handlers = {
    // Blockchain
    [RPC_METHODS.getbestblockhash]: async (): Promise<string> => JSONHelper.writeUInt256(blockchain.currentBlock.hash),
    [RPC_METHODS.getblock]: async (args): Promise<BlockJSON | string> => {
      let hashOrIndex: number | UInt256 = args[0];
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
        const confirmations = blockchain.currentBlockIndex - block.index + 1;
        const hash = await blockchain.getNextBlockHash(block.hash);
        const nextblockhash = hash ? JSONHelper.writeUInt256(hash) : undefined;
        const result = await block.serializeJSON(blockchain.serializeJSONContext);

        return {
          ...result,
          confirmations,
          nextblockhash,
        };
      }

      return block.serializeWire().toString('base64');
    },
    [RPC_METHODS.getblockheadercount]: async (): Promise<number> =>
      blockchain.headerCache.last?.index ?? (await blockchain.getCurrentIndex()) + 1,
    [RPC_METHODS.getblockcount]: async (): Promise<number> => (await blockchain.getCurrentIndex()) + 1,
    [RPC_METHODS.getblockhash]: async (args): Promise<string | undefined> => {
      const height = args[0];
      await checkHeight(height);
      const hash = await blockchain.getBlockHash(height);

      return hash === undefined ? undefined : JSONHelper.writeUInt256(hash);
    },

    [RPC_METHODS.getblockheader]: async (args): Promise<HeaderJSON | string> => {
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
        const confirmations = (await blockchain.getCurrentIndex()) - header.index + 1;
        const hash = await blockchain.getBlockHash(header.index + 1);
        const nextblockhash = hash ? JSONHelper.writeUInt256(hash) : undefined;

        return { ...header.serializeJSON(blockchain.serializeJSONContext), confirmations, nextblockhash };
      }

      return header.serializeWire().toString('base64');
    },
    [RPC_METHODS.getcontractstate]: async (args): Promise<ContractJSON> => {
      const hash = toScriptHash(args[0]);
      const contract = await native.ContractManagement.getContract({ storages: blockchain.storages }, hash);
      if (contract === undefined) {
        throw new JSONRPCError(-100, 'Unknown contract');
      }

      return contract.serializeJSON();
    },
    [RPC_METHODS.getrawmempool]: async (): Promise<readonly string[]> =>
      Object.values(node.memPool).map((transaction) => JSONHelper.writeUInt256(transaction.hash)),
    [RPC_METHODS.getrawtransaction]: async (args): Promise<TransactionJSON | ConfirmedTransactionJSON | string> => {
      const hash = JSONHelper.readUInt256(args[0]);
      const verbose = args.length >= 2 && !!args[1];

      let tx = node.memPool[common.uInt256ToHex(hash)] as Transaction | undefined;
      if (tx && !verbose) {
        return JSONHelper.writeBase64Buffer(tx.serializeWire());
      }

      const state = await blockchain.getTransaction(hash);
      tx = tx ?? state?.transaction;

      if (tx === undefined) {
        throw new JSONRPCError(-100, 'Unknown Transaction');
      }

      if (!verbose) {
        return JSONHelper.writeBase64Buffer(tx.serializeWire());
      }

      if (state !== undefined) {
        const index = await blockchain.getBlockHash(state.blockIndex);
        if (index === undefined) {
          return tx.serializeJSON();
        }
        const block = await blockchain.getBlock(index);
        if (block === undefined) {
          return tx.serializeJSON();
        }

        return tx.serializeJSONWithData(blockchain.serializeJSONContext);
      }

      return tx.serializeJSON();
    },
    [RPC_METHODS.getstorage]: async (args): Promise<StorageItemJSON | string> => {
      const hash = JSONHelper.readUInt160(args[0]);
      const verbose = args.length >= 3 ? !!args[2] : false;
      const state = await native.ContractManagement.getContract({ storages: blockchain.storages }, hash);
      if (state === undefined) {
        throw new JSONRPCError(-100, 'Unknown contract');
      }
      const id = state.id;

      const key = JSONHelper.readBase64Buffer(args[1]);
      const storageKey = new StorageKey({ id, key });
      const item = await blockchain.storages.tryGet(storageKey);

      if (item === undefined) {
        throw new JSONRPCError(-100, 'Unknown storage');
      }

      if (verbose) {
        return item.serializeJSON(storageKey);
      }

      return JSONHelper.writeBase64Buffer(item.value);
    },
    [RPC_METHODS.getnextblockvalidators]: async (): Promise<readonly ValidatorJSON[]> => {
      const [validators, candidates] = await Promise.all([
        native.NEO.computeNextBlockValidators({ storages: blockchain.storages }),
        native.NEO.getCandidates({ storages: blockchain.storages }),
      ]);

      if (candidates.length > 0) {
        return candidates.map((candidate) => ({
          publickey: JSONHelper.writeECPoint(candidate.publicKey),
          votes: candidate.votes.toString(),
          active: validators.some((validator) => validator.equals(candidate.publicKey)),
        }));
      }

      return validators.map((validator) => ({
        publickey: JSONHelper.writeECPoint(validator),
        votes: '0',
        active: true,
      }));
    },
    [RPC_METHODS.gettransactionheight]: async (args) => {
      const hash = JSONHelper.readUInt256(args[0]);
      const state = await blockchain.getTransaction(hash);
      if (state === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      return state.blockIndex;
    },

    // Node
    [RPC_METHODS.getconnectioncount]: async (): Promise<number> => node.connectedPeers.length,
    [RPC_METHODS.getpeers]: async (): Promise<{ readonly connected: readonly Peer[] }> => ({
      connected: node.connectedPeers.map((endpoint) => {
        const { host, port } = getEndpointConfig(endpoint);

        return { address: host, port };
      }),
    }),
    [RPC_METHODS.getversion]: async (): Promise<VersionJSON> => {
      const { tcpPort: tcpport, wsPort: wsport, nonce, useragent } = node.version;
      const { network } = blockchain.settings;

      return {
        network,
        tcpport,
        wsport,
        nonce,
        useragent,
      };
    },
    [RPC_METHODS.sendrawtransaction]: async (args): Promise<SendRawTransactionResultJSON> => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBase64Buffer(args[0]),
      });

      try {
        const { verifyResult: result } = await node.relayTransaction(transaction, { forceAdd: true });
        if (result !== undefined && result.verifyResult !== VerifyResultModel.Succeed) {
          throw new JSONRPCError(-500, getVerifyResultErrorMessage(result));
        }

        return { hash: common.uInt256ToString(transaction.hash) };
      } catch (error) {
        throw new JSONRPCError(-500, error.message);
      }
    },
    [RPC_METHODS.submitblock]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.getcommittee]: async (): Promise<readonly string[]> =>
      (await native.NEO.getCommittee({ storages: blockchain.storages })).map((member) =>
        common.ecPointToString(member),
      ),
    [RPC_METHODS.getnativecontracts]: async (): Promise<readonly NativeContractJSON[]> =>
      native.nativeContracts.map((nativeContract) => nativeContract.serializeJSON()),

    // SmartContract
    [RPC_METHODS.invokefunction]: async (_args) => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokescript]: async (args): Promise<CallReceiptJSON> => {
      const script = JSONHelper.readBase64Buffer(args[0]);
      const signers = args[1] !== undefined ? Signers.fromJSON(args[1]) : undefined;
      const receipt = blockchain.invokeScript({ script, signers });

      return {
        result: receipt.result.serializeJSON(),
        actions: receipt.actions.map((action) => action.serializeJSON()),
      };
    },
    [RPC_METHODS.testtransaction]: async (args): Promise<CallReceiptJSON> => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      const receipt = blockchain.testTransaction(transaction);

      return {
        result: receipt.result.serializeJSON(),
        actions: receipt.actions.map((action) => action.serializeJSON()),
      };
    },
    [RPC_METHODS.getunclaimedgas]: async (args): Promise<UnclaimedGASJSON> => {
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
        (await blockchain.getCurrentIndex()) + 1,
      );

      return {
        unclaimed: unclaimed.toString(10),
        address: JSONHelper.writeUInt160(address),
      };
    },
    // Utilities
    [RPC_METHODS.validateaddress]: async (args): Promise<ValidateAddressJSON> => {
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
    [RPC_METHODS.getapplicationlog]: async (args): Promise<ApplicationLogJSON> => {
      const hash = JSONHelper.readUInt256(args[0]);
      let trigger: TriggerTypeJSON | undefined;
      if (args.length >= 2 && args[1] != undefined) {
        try {
          trigger = assertTriggerTypeJSON(args[1]);
        } catch {
          // do nothing
        }
      }
      const value = await blockchain.applicationLogs.tryGet(hash);
      if (value === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction/blockhash');
      }

      const { txid, blockhash, executions } = value;

      return {
        txid,
        blockhash,
        executions:
          trigger === undefined ? executions : executions.filter((execution) => execution.trigger === trigger),
      };
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
    [RPC_METHODS.calculatenetworkfee]: async () => {
      throw new JSONRPCError(-101, 'Not implemented');
    },
    [RPC_METHODS.invokecontractverify]: async () => {
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

    // NEP17
    [RPC_METHODS.getnep17transfers]: async (args): Promise<Nep17TransfersJSON> => {
      const addressVersion = blockchain.settings.addressVersion;
      const { address, scriptHash } = getScriptHashAndAddress(args[0], addressVersion);

      const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
      const startTime = args[1] == undefined ? Date.now() - SEVEN_DAYS_IN_MS : args[1];
      const endTime = args[2] == undefined ? Date.now() : args[2];

      let source = Nep17TransferSource.Transaction;
      if (args[3] === 'All') {
        source = Nep17TransferSource.All;
      }
      if (args[3] === 'Block') {
        source = Nep17TransferSource.Block;
      }

      if (endTime < startTime) {
        throw new JSONRPCError(-32602, 'Invalid params');
      }

      const startTimeBytes = new BinaryWriter().writeUInt64LE(new BN(startTime)).toBuffer();
      const endTimeBytes = new BinaryWriter().writeUInt64LE(new BN(endTime)).toBuffer();
      const gte = Buffer.concat([scriptHash, startTimeBytes]);
      const lte = Buffer.concat([scriptHash, endTimeBytes]);

      const sentPromise = blockchain.nep17TransfersSent
        .find$(gte, lte)
        .pipe(
          filter(({ value }) => (source === Nep17TransferSource.All ? true : value.source === source)),
          map(mapToTransfers),
          toArray(),
        )
        .toPromise();
      const receivedPromise = blockchain.nep17TransfersReceived
        .find$(gte, lte)
        .pipe(
          filter(({ value }) => (source === Nep17TransferSource.All ? true : value.source === source)),
          map(mapToTransfers),
          toArray(),
        )
        .toPromise();

      const [sent, received] = await Promise.all([sentPromise, receivedPromise]);

      return {
        sent,
        received,
        address,
      };
    },
    [RPC_METHODS.getnep17balances]: async (args): Promise<Nep17BalancesJSON> => {
      // tslint:disable-next-line: no-suspicious-comment
      // TODO: need to check/test method this but probably good
      const { address, scriptHash } = getScriptHashAndAddress(args[0], blockchain.settings.addressVersion);
      const storedBalances = await blockchain.nep17Balances.find$(scriptHash).pipe(toArray()).toPromise();
      const validBalances = await Promise.all(
        storedBalances.map(async ({ key, value }) => {
          const assetStillExists = await native.ContractManagement.getContract(
            { storages: blockchain.storages },
            key.assetScriptHash,
          );
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
    [RPC_METHODS.updatesettings]: async (args): Promise<boolean> => {
      const { settings } = blockchain;
      const newSettings = {
        ...settings,
        millisecondsPerBlock: args[0].millisecondsPerBlock,
      };

      blockchain.updateSettings(newSettings);

      return true;
    },
    [RPC_METHODS.getsettings]: async (): Promise<PrivateNetworkSettings> => ({
      millisecondsPerBlock: blockchain.settings.millisecondsPerBlock,
    }),

    // NEO•ONE
    [RPC_METHODS.relaytransaction]: async (args): Promise<RelayTransactionResultJSON> => {
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });

      try {
        const transactionJSON = transaction.serializeJSON();
        const { verifyResult: result } = await node.relayTransaction(transaction, { forceAdd: true });

        const resultJSON =
          result !== undefined && result.verifyResult !== undefined
            ? toVerifyResultJSON(result.verifyResult)
            : undefined;

        return {
          transaction: transactionJSON,
          verifyResult: resultJSON,
          failureMessage: result?.failureReason,
        };
      } catch (error) {
        throw new JSONRPCError(-110, `Relay transaction failed: ${error.message}`);
      }
    },
    [RPC_METHODS.getallstorage]: async (args): Promise<readonly StorageItemJSON[]> => {
      const hash = JSONHelper.readUInt160(args[0]);
      if (native.nativeHashes.some((natHash) => natHash.equals(hash))) {
        throw new Error("Can't get all storage for native contracts.");
      }
      const contract = await native.ContractManagement.getContract({ storages: blockchain.storages }, hash);
      if (contract === undefined) {
        return [];
      }
      const buffer = new BinaryWriter().writeInt32LE(contract.id).toBuffer();

      return blockchain.storages
        .find$(buffer)
        .pipe(
          map(({ key, value }) => value.serializeJSON(key)),
          toArray(),
        )
        .toPromise();
    },

    [RPC_METHODS.gettransactionreceipt]: async (args): Promise<TransactionReceiptJSON | undefined> => {
      const state = await blockchain.getTransaction(JSONHelper.readUInt256(args[0]));

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
                const data = await blockchain.getTransaction(JSONHelper.readUInt256(args[0]));

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

    [RPC_METHODS.gettransactiondata]: async (args): Promise<TransactionDataJSON> => {
      const state = await blockchain.getTransaction(JSONHelper.readUInt256(args[0]));

      if (state === undefined) {
        throw new JSONRPCError(-100, 'Unknown transaction');
      }

      const result = await state.transaction.serializeJSONWithData(blockchain.serializeJSONContext);

      if (result.transactionData === undefined) {
        throw new JSONRPCError(-103, 'No transaction data found');
      }

      return result.transactionData;
    },

    [RPC_METHODS.getnetworksettings]: async (): Promise<NetworkSettingsJSON> => {
      const {
        decrementInterval,
        generationAmount,
        privateKeyVersion,
        standbyValidators,
        network,
        maxValidUntilBlockIncrement,
        addressVersion,
        standbyCommittee,
        committeeMembersCount,
        validatorsCount,
        millisecondsPerBlock,
        memoryPoolMaxTransactions,
        maxTraceableBlocks,
        initialGasDistribution,
        maxBlockSize,
        maxBlockSystemFee,
        maxTransactionsPerBlock,
        nativeUpdateHistory,
      } = blockchain.settings;

      return {
        blockcount: blockchain.currentBlockIndex + 1,
        decrementinterval: decrementInterval,
        generationamount: generationAmount,
        privatekeyversion: privateKeyVersion,
        standbyvalidators: standbyValidators.map((val) => common.ecPointToString(val)),
        network,
        maxvaliduntilblockincrement: maxValidUntilBlockIncrement,
        addressversion: addressVersion,
        standbycommittee: standbyCommittee.map((val) => common.ecPointToString(val)),
        committeememberscount: committeeMembersCount,
        validatorscount: validatorsCount,
        millisecondsperblock: millisecondsPerBlock,
        memorypoolmaxtransactions: memoryPoolMaxTransactions,
        maxtraceableblocks: maxTraceableBlocks,
        initialgasdistribution: initialGasDistribution.toNumber(),
        maxblocksize: maxBlockSize,
        maxblocksystemfee: maxBlockSystemFee.toNumber(),
        maxtransactionsperblock: maxTransactionsPerBlock,
        nativeupdatehistory: nativeUpdateHistory,
      };
    },
    [RPC_METHODS.getfeeperbyte]: async (): Promise<string> => {
      const feePerByte = await blockchain.getFeePerByte();

      return feePerByte.toString();
    },
    [RPC_METHODS.getexecfeefactor]: async (): Promise<number> =>
      native.Policy.getExecFeeFactor({ storages: blockchain.storages }),
    [RPC_METHODS.getverificationcost]: async (args): Promise<VerificationCostJSON> => {
      const hash = JSONHelper.readUInt160(args[0]);
      const transaction = Transaction.deserializeWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[1]),
      });

      const { fee, size } = await blockchain.getVerificationCost(hash, transaction);

      return { fee: fee.toString(), size };
    },
    [RPC_METHODS.runconsensusnow]: async (): Promise<boolean> => {
      if (node.consensus) {
        await node.consensus.runConsensusNow();
      } else {
        throw new Error('This node does not support triggering consensus.');
      }

      return true;
    },

    [RPC_METHODS.fastforwardoffset]: async (args): Promise<boolean> => {
      if (node.consensus) {
        await node.consensus.fastForwardOffset(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
    [RPC_METHODS.fastforwardtotime]: async (args): Promise<boolean> => {
      if (node.consensus !== undefined) {
        await node.consensus.fastForwardToTime(args[0]);
      } else {
        throw new Error('This node does not support fast forwarding.');
      }

      return true;
    },
    [RPC_METHODS.reset]: async (): Promise<boolean> => {
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
    [RPC_METHODS.getneotrackerurl]: async (): Promise<string | undefined> => handleGetNEOTrackerURL(),
    [RPC_METHODS.resetproject]: async (): Promise<boolean> => {
      await handleResetProject();

      return true;
    },
  };

  return createJSONRPCHandler(handlers);
};
