/* @flow */
import type BN from 'bn.js';

import {
  SCRIPT_CONTAINER_TYPE,
  type Block,
  type ConsensusPayload,
  type ECPoint,
  type Header,
  type Input,
  type InvocationResult,
  type Output,
  type OutputKey,
  type SerializableInvocationData,
  type Transaction,
  type UInt160,
  type Validator,
  type VerifyScriptOptions,
  InvocationTransaction,
  ScriptBuilder,
  common,
  crypto,
  utils,
} from '@neo-one/client-core';
import {
  NULL_ACTION,
  TRIGGER_TYPE,
  type Blockchain as BlockchainType,
  type OnStepInput,
  type Storage,
  type VM,
} from '@neo-one/node-core';
import {
  type Log,
  Performance,
  utils as commonUtils,
  performanceNow,
} from '@neo-one/utils';
import PriorityQueue from 'js-priority-queue';
import { Subject } from 'rxjs/Subject';

import _ from 'lodash';
import { filter, map, toArray } from 'rxjs/operators';

import {
  GenesisBlockNotRegisteredError,
  ScriptVerifyError,
  WitnessVerifyError,
} from './errors';
import WriteBatchBlockchain from './WriteBatchBlockchain';

import getValidators from './getValidators';
import wrapExecuteScripts from './wrapExecuteScripts';

export type CreateBlockchainOptions = {|
  settings: $PropertyType<BlockchainType, 'settings'>,
  storage: Storage,
  vm: VM,
  log: Log,
|};

export type BlockchainOptions = {|
  ...CreateBlockchainOptions,
  currentBlock: ?$PropertyType<BlockchainType, 'currentBlock'>,
  currentHeader: ?$PropertyType<BlockchainType, 'currentHeader'>,
|};

type SpentCoin = {|
  output: Output,
  startHeight: number,
  endHeight: number,
  claimed: boolean,
|};

type Vote = {|
  publicKeys: Array<ECPoint>,
  count: BN,
|};

export default class Blockchain {
  settings: $PropertyType<BlockchainType, 'settings'>;
  log: $PropertyType<BlockchainType, 'log'>;
  deserializeWireContext: $PropertyType<
    BlockchainType,
    'deserializeWireContext',
  >;
  serializeJSONContext: $PropertyType<BlockchainType, 'serializeJSONContext'>;
  feeContext: $PropertyType<BlockchainType, 'feeContext'>;

  account: $PropertyType<BlockchainType, 'account'>;
  accountUnclaimed: $PropertyType<BlockchainType, 'accountUnclaimed'>;
  accountUnspent: $PropertyType<BlockchainType, 'accountUnspent'>;
  action: $PropertyType<BlockchainType, 'action'>;
  asset: $PropertyType<BlockchainType, 'asset'>;
  block: $PropertyType<BlockchainType, 'block'>;
  blockSystemFee: $PropertyType<BlockchainType, 'blockSystemFee'>;
  header: $PropertyType<BlockchainType, 'header'>;
  transaction: $PropertyType<BlockchainType, 'transaction'>;
  transactionSpentCoins: $PropertyType<BlockchainType, 'transactionSpentCoins'>;
  output: $PropertyType<BlockchainType, 'output'>;
  contract: $PropertyType<BlockchainType, 'contract'>;
  storageItem: $PropertyType<BlockchainType, 'storageItem'>;
  validator: $PropertyType<BlockchainType, 'validator'>;
  invocationData: $PropertyType<BlockchainType, 'invocationData'>;
  validatorsCount: $PropertyType<BlockchainType, 'validatorsCount'>;

  _storage: Storage;
  _currentBlock: ?$PropertyType<BlockchainType, 'currentBlock'>;
  _currentHeader: ?$PropertyType<BlockchainType, 'currentHeader'>;
  _persistingBlocks: boolean;
  _blockQueue: PriorityQueue;
  _inQueue: Set<number>;
  _vm: VM;
  _running: boolean;
  _doneRunningResolve: ?() => void;
  _perf: Performance;

  block$: Subject<Block>;

  constructor(options: BlockchainOptions) {
    this._storage = options.storage;
    this._currentBlock = options.currentBlock;
    this._currentHeader = options.currentHeader;
    this._persistingBlocks = false;
    this._blockQueue = new PriorityQueue({
      comparator: (a, b) => a.block.index - b.block.index,
    });
    this._inQueue = new Set();
    this._vm = options.vm;
    this._running = true;
    this._doneRunningResolve = null;
    this._perf = new Performance();

    this.settings = options.settings;
    this.log = options.log;

    this.account = this._storage.account;
    this.accountUnclaimed = this._storage.accountUnclaimed;
    this.accountUnspent = this._storage.accountUnspent;
    this.action = this._storage.action;
    this.asset = this._storage.asset;
    this.block = {
      get: this._storage.block.get,
      tryGet: this._storage.block.tryGet,
    };
    this.blockSystemFee = this._storage.blockSystemFee;
    this.header = {
      get: this._storage.header.get,
      tryGet: this._storage.header.tryGet,
    };
    this.transaction = this._storage.transaction;
    this.transactionSpentCoins = this._storage.transactionSpentCoins;
    this.output = this._storage.output;
    this.contract = this._storage.contract;
    this.storageItem = this._storage.storageItem;
    this.validator = this._storage.validator;
    this.invocationData = this._storage.invocationData;
    this.validatorsCount = this._storage.validatorsCount;

    this.deserializeWireContext = {
      messageMagic: this.settings.messageMagic,
    };
    this.feeContext = {
      getOutput: this.output.get,
      governingToken: this.settings.governingToken,
      utilityToken: this.settings.utilityToken,
      fees: this.settings.fees,
      registerValidatorFee: this.settings.registerValidatorFee,
    };
    this.serializeJSONContext = {
      addressVersion: this.settings.addressVersion,
      feeContext: this.feeContext,
      tryGetInvocationData: this._tryGetInvocationData,
      getUnclaimed: this._getUnclaimed,
      getUnspent: this._getUnspent,
    };

    this.block$ = new Subject();
  }

  static async create({
    settings,
    storage,
    vm,
    log,
  }: CreateBlockchainOptions): Promise<BlockchainType> {
    const [currentBlock, currentHeader] = await Promise.all([
      storage.block.tryGetLatest(),
      storage.header.tryGetLatest(),
    ]);

    const blockchain = new Blockchain({
      currentBlock,
      currentHeader,
      settings,
      storage,
      vm,
      log,
    });

    if (currentHeader == null) {
      await blockchain.persistHeaders([settings.genesisBlock.header]);
    }

    if (currentBlock == null) {
      await blockchain.persistBlock({ block: settings.genesisBlock });
    }

    return blockchain;
  }

  async stop(): Promise<void> {
    if (!this._running) {
      return;
    }

    if (this._persistingBlocks) {
      const doneRunningPromise = new Promise(resolve => {
        this._doneRunningResolve = resolve;
      });
      this._running = false;

      await doneRunningPromise;
    } else {
      this._running = false;
    }
  }

  get currentBlock(): Block {
    if (this._currentBlock == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentBlock;
  }

  get currentHeader(): Header {
    if (this._currentHeader == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentHeader;
  }

  get currentBlockIndex(): number {
    return this._currentBlock == null ? -1 : this._currentBlock.index;
  }

  get isPersistingBlock(): boolean {
    return this._persistingBlocks;
  }

  persistBlock({
    block,
    unsafe,
  }: {|
    block: Block,
    unsafe?: boolean,
  |}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._inQueue.has(block.index)) {
        return;
      }
      this._inQueue.add(block.index);

      this._blockQueue.queue({ block, resolve, reject, unsafe });
      this._persistBlocksAsync();
    });
  }

  // eslint-disable-next-line
  async persistHeaders(headers: Array<Header>): Promise<void> {
    // TODO: Perhaps don't implement this?
  }

  async verifyBlock(block: Block): Promise<void> {
    await block.verify({
      genesisBlock: this.settings.genesisBlock,
      tryGetBlock: this.block.tryGet,
      tryGetHeader: this.header.tryGet,
      isSpent: this._isSpent,
      getAsset: this.asset.get,
      getOutput: this.output.get,
      tryGetAccount: this.account.tryGet,
      getValidators: this.getValidators,
      standbyValidators: this.settings.standbyValidators,
      getAllValidators: this._getAllValidators,
      calculateClaimAmount: this.calculateClaimAmount,
      verifyScript: this.verifyScript,
      currentHeight: this._currentBlock == null ? 0 : this._currentBlock.index,
      governingToken: this.settings.governingToken,
      utilityToken: this.settings.utilityToken,
      fees: this.settings.fees,
      registerValidatorFee: this.settings.registerValidatorFee,
    });
  }

  async verifyConsensusPayload(payload: ConsensusPayload): Promise<void> {
    await payload.verify({
      getValidators: () => this.getValidators([]),
      verifyScript: this.verifyScript,
      currentIndex: this._currentBlock == null ? 0 : this._currentBlock.index,
      currentBlockHash: this.currentBlock.hash,
    });
  }

  async verifyTransaction({
    transaction,
    memPool,
  }: {
    transaction: Transaction,
    memPool?: Array<Transaction>,
  }): Promise<void> {
    await transaction.verify({
      calculateClaimAmount: this.calculateClaimAmount,
      isSpent: this._isSpent,
      getAsset: this.asset.get,
      getOutput: this.output.get,
      tryGetAccount: this.account.tryGet,
      standbyValidators: this.settings.standbyValidators,
      getAllValidators: () => this.validator.all.pipe(toArray()).toPromise(),
      verifyScript: this.verifyScript,
      governingToken: this.settings.governingToken,
      utilityToken: this.settings.utilityToken,
      fees: this.settings.fees,
      registerValidatorFee: this.settings.registerValidatorFee,
      currentHeight: this.currentBlockIndex,
      memPool,
    });
  }

  async invokeScript(script: Buffer): Promise<InvocationResult> {
    const transaction = new InvocationTransaction({
      script,
      gas: common.ONE_HUNDRED_FIXED8,
    });

    return this.invokeTransaction(transaction);
  }

  async invokeTransaction(
    transaction: InvocationTransaction,
  ): Promise<InvocationResult> {
    const blockchain = this._createWriteBlockchain();

    return wrapExecuteScripts(() =>
      this._vm.executeScripts({
        scripts: [{ code: transaction.script }],
        blockchain,
        scriptContainer: {
          type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
          value: transaction,
        },
        triggerType: TRIGGER_TYPE.APPLICATION,
        action: NULL_ACTION,
        gas: transaction.gas,
        onStep: this._onStep,
        skipWitnessVerify: true,
      }),
    );
  }

  async _persistBlocksAsync(): Promise<void> {
    if (this._persistingBlocks || !this._running) {
      return;
    }

    this._persistingBlocks = true;
    let entry;
    try {
      this.cleanBlockQueue();
      entry = this.peekBlockQueue();
      while (
        this._running &&
        entry != null &&
        entry.block.index === this.currentBlockIndex + 1 // eslint-disable-next-line
      ) {
        entry = this._blockQueue.dequeue();
        const done = this._perf.start('Blockchain._persistBlocksAsync');
        const start = performanceNow();
        await this._persistBlock(entry.block, entry.unsafe);
        entry.resolve();
        this.block$.next(entry.block);
        const duration = performanceNow() - start;
        done();
        this.log({
          event: 'PERSIST_BLOCK_SUCCESS',
          index: entry.block.index,
          durationMS: duration,
        });
        if (
          this._perf.getCount('Blockchain._persistBlocksAsync') % 1000 ===
          0
        ) {
          this.log({
            event: 'PERSIST_BLOCK_PERF',
            index: entry.block.index,
            timings: (this._perf.toStats(): $FlowFixMe),
          });
          this._perf.reset();
        }

        this.cleanBlockQueue();
        entry = this.peekBlockQueue();
      }
    } catch (error) {
      if (entry != null) {
        entry.reject(error);
      }
      this.log({
        event: 'PERSIST_BLOCK_ERROR',
        error,
        index: entry == null ? null : entry.block.index,
      });
    } finally {
      this._persistingBlocks = false;
      if (this._doneRunningResolve != null) {
        this._doneRunningResolve();
        this._doneRunningResolve = null;
      }
    }
  }

  cleanBlockQueue(): void {
    let entry = this.peekBlockQueue();
    while (entry != null && entry.block.index <= this.currentBlockIndex) {
      this._blockQueue.dequeue();
      entry.resolve();
      entry = this.peekBlockQueue();
    }
  }

  peekBlockQueue(): ?{
    block: Block,
    resolve: () => void,
    reject: (error: Error) => void,
    unsafe?: boolean,
  } {
    if (this._blockQueue.length > 0) {
      return this._blockQueue.peek();
    }

    return null;
  }

  async _persistBlock(block: Block, unsafe?: boolean): Promise<void> {
    if (!unsafe) {
      await this.verifyBlock(block);
    }

    const blockchain = this._createWriteBlockchain(this._perf);

    let done = this._perf.start('Blockchain._persistBlock.persistBlock');
    await blockchain.persistBlock(block);
    done();

    done = this._perf.start('Blockchain._persistBlock.commit');
    await this._storage.commit(blockchain.getChangeSet());
    done();

    this._currentBlock = block;
    this._currentHeader = block.header;
  }

  verifyScript = async ({
    scriptContainer,
    hash,
    witness,
  }: VerifyScriptOptions): Promise<void> => {
    let { verification } = witness;
    if (verification.length === 0) {
      const builder = new ScriptBuilder();
      builder.emitAppCallVerification(hash);
      verification = builder.build();
    } else if (!common.uInt160Equal(hash, crypto.toScriptHash(verification))) {
      throw new WitnessVerifyError();
    }

    const blockchain = this._createWriteBlockchain();
    const result = await this._vm.executeScripts({
      scripts: [
        { code: witness.invocation, pushOnly: true },
        { code: verification },
      ],
      blockchain,
      scriptContainer,
      triggerType: TRIGGER_TYPE.VERIFICATION,
      action: NULL_ACTION,
      gas: utils.ZERO,
      onStep: this._onStep,
    });

    const { stack } = result;
    if (stack.length !== 1) {
      throw new ScriptVerifyError(
        `Verification did not return one result. This may be a bug in the ` +
          `smart contract. Found ${stack.length} results.`,
      );
    }

    const top = stack[0];
    if (!top.asBoolean()) {
      throw new ScriptVerifyError('Verification did not succeed.');
    }
  };

  calculateClaimAmount = async (claims: Array<Input>): Promise<BN> => {
    const spentCoins = await Promise.all(
      claims.map(claim => this._tryGetSpentCoin(claim)),
    );
    const filteredSpentCoins = spentCoins.filter(Boolean);
    if (spentCoins.length !== filteredSpentCoins.length) {
      // TODO: Better error
      throw new Error('Not all coins were spent');
    }

    if (filteredSpentCoins.some(coin => coin.claimed)) {
      // TODO: Better error
      throw new Error('Coin was already claimed');
    }

    if (
      filteredSpentCoins.some(
        coin =>
          !common.uInt256Equal(
            coin.output.asset,
            this.settings.governingToken.hash,
          ),
      )
    ) {
      // TODO: Better error
      throw new Error('Invalid claim');
    }

    return utils.calculateClaimAmount({
      coins: filteredSpentCoins.map(coin => ({
        value: coin.output.value,
        startHeight: coin.startHeight,
        endHeight: coin.endHeight,
      })),
      decrementInterval: this.settings.decrementInterval,
      generationAmount: this.settings.generationAmount,
      getSystemFee: async index => {
        const header = await this._storage.header.get({ hashOrIndex: index });
        const blockSystemFee = await this._storage.blockSystemFee.get({
          hash: header.hash,
        });
        return blockSystemFee.systemFee;
      },
    });
  };

  _isSpent = async (input: OutputKey): Promise<boolean> => {
    const transactionSpentCoins = await this.transactionSpentCoins.tryGet({
      hash: input.hash,
    });

    return (
      transactionSpentCoins != null &&
      transactionSpentCoins.endHeights[input.index] != null
    );
  };

  _tryGetSpentCoin = async (input: Input): Promise<?SpentCoin> => {
    const [transactionSpentCoins, output] = await Promise.all([
      this.transactionSpentCoins.tryGet({ hash: input.hash }),
      this.output.get(input),
    ]);
    if (transactionSpentCoins == null) {
      return null;
    }

    const endHeight = transactionSpentCoins.endHeights[input.index];
    if (endHeight == null) {
      return null;
    }

    const claimed = transactionSpentCoins.claimed[input.index];

    return {
      output,
      startHeight: transactionSpentCoins.startHeight,
      endHeight,
      claimed: !!claimed,
    };
  };

  getValidators = (transactions: Array<Transaction>): Promise<Array<ECPoint>> =>
    getValidators(this, transactions);

  _getVotes = async (
    transactions: Array<Transaction>,
  ): Promise<Array<Vote>> => {
    const inputs = await Promise.all(
      transactions.map(transaction =>
        transaction.getReferences({
          getOutput: this.output.get,
        }),
      ),
    ).then(results =>
      results
        .reduce((acc, inputResults) => acc.concat(inputResults), [])
        .map(output => ({
          address: output.address,
          asset: output.asset,
          value: output.value.neg(),
        })),
    );
    const outputs = transactions
      .reduce((acc, transaction) => acc.concat(transaction.outputs), [])
      .map(output => ({
        address: output.address,
        asset: output.asset,
        value: output.value,
      }));
    const changes = _.fromPairs(
      commonUtils
        .entries(
          _.groupBy(
            inputs
              .concat(outputs)
              .filter(output =>
                common.uInt256Equal(
                  output.asset,
                  this.settings.governingToken.hash,
                ),
              ),
            output => common.uInt160ToHex(output.address),
            // eslint-disable-next-line
          ),
        )
        .map(([addressHex, addressOutputs]) => [
          addressHex,
          addressOutputs.reduce(
            (acc, output) => acc.add(output.value),
            utils.ZERO,
          ),
        ]),
    );
    const votes = await this.account.all
      .pipe(
        filter(account => account.votes.length > 0),
        map(account => {
          let balance =
            account.balances[this.settings.governingToken.hashHex] ||
            utils.ZERO;
          balance = balance.add(changes[account.hashHex] || utils.ZERO);
          return balance.lte(utils.ZERO)
            ? null
            : {
                publicKeys: account.votes,
                count: balance,
              };
        }),
        toArray(),
      )
      .toPromise();
    if (votes.length === 0) {
      return [
        {
          publicKeys: this.settings.standbyValidators,
          count: this.settings.governingToken.asset.amount,
        },
      ];
    }

    return votes.filter(Boolean);
  };

  _createWriteBlockchain(perf?: Performance): WriteBatchBlockchain {
    return new WriteBatchBlockchain({
      settings: this.settings,
      currentBlock: this._currentBlock,
      currentHeader: this._currentHeader,
      storage: this._storage,
      vm: this._vm,
      onStep: this._onStep,
      getValidators: this.getValidators,
      log: this.log,
      perf,
    });
  }

  _tryGetInvocationData = async (
    transaction: InvocationTransaction,
  ): Promise<?SerializableInvocationData> => {
    const data = await this._storage.invocationData.tryGet({
      hash: transaction.hash,
    });
    if (data == null) {
      return null;
    }

    const [asset, contracts, actions] = await Promise.all([
      data.assetHash == null
        ? Promise.resolve(null)
        : this._storage.asset.get({ hash: data.assetHash }),
      Promise.all(
        data.contractHashes.map(contractHash =>
          this._storage.contract.get({ hash: contractHash }),
        ),
      ),
      // TODO: Make this more efficient with a DataLoader
      this._storage.action
        .getAll({
          blockIndexStart: data.blockIndex,
          transactionIndexStart: data.transactionIndex,
          blockIndexStop: data.blockIndex,
          transactionIndexStop: data.transactionIndex,
        })
        .pipe(toArray())
        .toPromise(),
    ]);

    return {
      asset,
      contracts,
      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      result: data.result,
      actions,
    };
  };

  _getUnclaimed = async (hash: UInt160): Promise<Array<Input>> => {
    const unclaimed = await this._storage.accountUnclaimed
      .getAll({ hash })
      .pipe(toArray())
      .toPromise();
    // TODO: Quick fix because unclaimed includes all spent coins.
    const filtered = await Promise.all(
      unclaimed.map(async value => {
        const output = await this._storage.output.get(value.input);
        if (
          common.uInt256Equal(output.asset, this.settings.governingToken.hash)
        ) {
          return value.input;
        }

        return (null: $FlowFixMe);
      }),
    );
    return filtered.filter(Boolean);
  };

  _getUnspent = async (hash: UInt160): Promise<Array<Input>> => {
    const unspent = await this._storage.accountUnspent
      .getAll({ hash })
      .pipe(toArray())
      .toPromise();
    return unspent.map(value => value.input);
  };

  _onStep = ({ context, opCode }: OnStepInput) => {
    const scriptHash = common.uInt160ToString(context.scriptHash);
    this.log({
      event: 'VM_STEP',
      level: 'silly',
      scriptHash,
      pc: context.pc,
      opCode,
    });
  };

  _getAllValidators(): Promise<Array<Validator>> {
    return this.validator.all.pipe(toArray()).toPromise();
  }
}
