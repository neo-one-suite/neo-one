// tslint:disable no-array-mutation no-object-mutation
import { common, ECPoint, UInt160, UInt256, utils } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import {
  Account,
  AccountKey,
  AccountUnclaimed,
  AccountUnclaimedKey,
  AccountUnclaimedsKey,
  AccountUnspent,
  AccountUnspentKey,
  AccountUnspentsKey,
  AccountUpdate,
  Action,
  ActionKey,
  ActionsKey,
  Asset,
  AssetKey,
  AssetUpdate,
  Block,
  BlockchainStorage,
  BlockData,
  BlockDataKey,
  ChangeSet,
  ClaimTransaction,
  Contract,
  ContractKey,
  ContractTransaction,
  EnrollmentTransaction,
  Header,
  Input,
  InvocationData,
  InvocationDataKey,
  InvocationResultSuccess,
  InvocationTransaction,
  IssueTransaction,
  LogAction,
  MinerTransaction,
  NotificationAction,
  Output,
  PublishTransaction,
  RegisterTransaction,
  ScriptContainerType,
  StateTransaction,
  StorageChangeAdd,
  StorageChangeDelete,
  StorageChangeModify,
  StorageItem,
  StorageItemKey,
  StorageItemsKey,
  StorageItemUpdate,
  Transaction,
  TransactionData,
  TransactionDataKey,
  TransactionDataUpdate,
  TransactionKey,
  TransactionType,
  TriggerType,
  Validator,
  ValidatorKey,
  ValidatorsCount,
  ValidatorsCountUpdate,
  ValidatorUpdate,
  VM,
  WriteBlockchain,
} from '@neo-one/node-core';
import { labels, utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import _ from 'lodash';
import { GenesisBlockNotRegisteredError } from './errors';
import { AccountChanges, getDescriptorChanges, ValidatorChanges, ValidatorsCountChanges } from './getValidators';
import {
  BlockLikeStorageCache,
  OutputStorageCache,
  ReadAddDeleteStorageCache,
  ReadAddStorageCache,
  ReadAddUpdateMetadataStorageCache,
  ReadAddUpdateStorageCache,
  ReadAllAddUpdateDeleteStorageCache,
  ReadGetAllAddDeleteStorageCache,
  ReadGetAllAddStorageCache,
  ReadGetAllAddUpdateDeleteStorageCache,
  TrackedChangeSet,
} from './StorageCache';
import { wrapExecuteScripts } from './wrapExecuteScripts';

interface WriteBatchBlockchainOptions {
  readonly settings: WriteBlockchain['settings'];
  readonly currentBlock: WriteBlockchain['currentBlock'] | undefined;
  readonly currentHeader: WriteBlockchain['currentHeader'] | undefined;
  readonly storage: BlockchainStorage;
  readonly vm: VM;
  readonly getValidators: WriteBlockchain['getValidators'];
}

interface Caches {
  readonly account: ReadAllAddUpdateDeleteStorageCache<AccountKey, Account, AccountUpdate>;
  readonly accountUnspent: ReadGetAllAddDeleteStorageCache<AccountUnspentKey, AccountUnspentsKey, AccountUnspent>;
  readonly accountUnclaimed: ReadGetAllAddDeleteStorageCache<
    AccountUnclaimedKey,
    AccountUnclaimedsKey,
    AccountUnclaimed
  >;
  readonly action: ReadGetAllAddStorageCache<ActionKey, ActionsKey, Action>;
  readonly asset: ReadAddUpdateStorageCache<AssetKey, Asset, AssetUpdate>;
  readonly block: BlockLikeStorageCache<Block>;
  readonly blockData: ReadAddStorageCache<BlockDataKey, BlockData>;
  readonly header: BlockLikeStorageCache<Header>;
  readonly transaction: ReadAddStorageCache<TransactionKey, Transaction>;
  readonly transactionData: ReadAddUpdateStorageCache<TransactionDataKey, TransactionData, TransactionDataUpdate>;
  readonly output: OutputStorageCache;
  readonly contract: ReadAddDeleteStorageCache<ContractKey, Contract>;
  readonly storageItem: ReadGetAllAddUpdateDeleteStorageCache<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate
  >;
  readonly validator: ReadAllAddUpdateDeleteStorageCache<ValidatorKey, Validator, ValidatorUpdate>;
  readonly invocationData: ReadAddStorageCache<InvocationDataKey, InvocationData>;
  readonly validatorsCount: ReadAddUpdateMetadataStorageCache<ValidatorsCount, ValidatorsCountUpdate>;
}

interface InputClaim {
  readonly type: 'claim' | 'input';
  readonly hash: UInt256;
  readonly input: Input;
}

interface OutputWithInput {
  readonly output: Output;
  readonly input: Input;
}

export class WriteBatchBlockchain {
  public readonly settings: WriteBlockchain['settings'];
  public readonly account: ReadAllAddUpdateDeleteStorageCache<AccountKey, Account, AccountUpdate>;
  public readonly accountUnspent: ReadGetAllAddDeleteStorageCache<
    AccountUnspentKey,
    AccountUnspentsKey,
    AccountUnspent
  >;
  public readonly accountUnclaimed: ReadGetAllAddDeleteStorageCache<
    AccountUnclaimedKey,
    AccountUnclaimedsKey,
    AccountUnclaimed
  >;
  public readonly action: ReadGetAllAddStorageCache<ActionKey, ActionsKey, Action>;
  public readonly asset: ReadAddUpdateStorageCache<AssetKey, Asset, AssetUpdate>;
  public readonly block: BlockLikeStorageCache<Block>;
  public readonly blockData: ReadAddStorageCache<BlockDataKey, BlockData>;
  public readonly header: BlockLikeStorageCache<Header>;
  public readonly transaction: ReadAddStorageCache<TransactionKey, Transaction>;
  public readonly transactionData: ReadAddUpdateStorageCache<
    TransactionDataKey,
    TransactionData,
    TransactionDataUpdate
  >;
  public readonly output: OutputStorageCache;
  public readonly contract: ReadAddDeleteStorageCache<ContractKey, Contract>;
  public readonly storageItem: ReadGetAllAddUpdateDeleteStorageCache<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate
  >;
  public readonly validator: ReadAllAddUpdateDeleteStorageCache<ValidatorKey, Validator, ValidatorUpdate>;
  public readonly invocationData: ReadAddStorageCache<InvocationDataKey, InvocationData>;
  public readonly validatorsCount: ReadAddUpdateMetadataStorageCache<ValidatorsCount, ValidatorsCountUpdate>;
  public readonly getValidators: WriteBlockchain['getValidators'];
  private readonly currentBlockInternal: WriteBlockchain['currentBlock'] | undefined;
  private readonly currentHeaderInternal: WriteBlockchain['currentHeader'] | undefined;
  private readonly storage: BlockchainStorage;
  private readonly vm: VM;
  private readonly caches: Caches;

  public constructor(options: WriteBatchBlockchainOptions) {
    this.settings = options.settings;
    this.currentBlockInternal = options.currentBlock;
    this.currentHeaderInternal = options.currentHeader;
    this.storage = options.storage;
    this.vm = options.vm;
    this.getValidators = options.getValidators;

    const output = new OutputStorageCache(() => this.storage.output);
    this.caches = {
      account: new ReadAllAddUpdateDeleteStorageCache({
        name: 'account',
        readAllStorage: () => this.storage.account,
        update: (value, update) => value.update(update),
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt160ToString(key.hash),
        createAddChange: (value) => ({ type: 'account', value }),
        createDeleteChange: (key) => ({ type: 'account', key }),
      }),
      accountUnspent: new ReadGetAllAddDeleteStorageCache({
        name: 'accountUnspent',
        readGetAllStorage: () => this.storage.accountUnspent,
        getKeyFromValue: (value) => ({ hash: value.hash, input: value.input }),
        getKeyString: (key) =>
          `${common.uInt160ToString(key.hash)}:${common.uInt256ToString(key.input.hash)}:${key.input.index}`,
        matchesPartialKey: (value, key) => common.uInt160Equal(value.hash, key.hash),
        createAddChange: (value) => ({ type: 'accountUnspent', value }),
        createDeleteChange: (key) => ({ type: 'accountUnspent', key }),
      }),
      accountUnclaimed: new ReadGetAllAddDeleteStorageCache({
        name: 'accountUnclaimed',
        readGetAllStorage: () => this.storage.accountUnclaimed,
        getKeyFromValue: (value) => ({ hash: value.hash, input: value.input }),
        getKeyString: (key) =>
          `${common.uInt160ToString(key.hash)}:${common.uInt256ToString(key.input.hash)}:${key.input.index}`,
        matchesPartialKey: (value, key) => common.uInt160Equal(value.hash, key.hash),
        createAddChange: (value) => ({ type: 'accountUnclaimed', value }),
        createDeleteChange: (key) => ({ type: 'accountUnclaimed', key }),
      }),
      action: new ReadGetAllAddStorageCache({
        name: 'action',
        readGetAllStorage: () => this.storage.action,
        getKeyFromValue: (value) => ({
          index: value.index,
        }),
        getKeyString: (key) => key.index.toString(10),
        matchesPartialKey: (value, key) =>
          (key.indexStart === undefined || value.index.gte(key.indexStart)) &&
          (key.indexStop === undefined || value.index.lte(key.indexStop)),
        createAddChange: (value) => ({ type: 'action', value }),
      }),
      asset: new ReadAddUpdateStorageCache({
        name: 'asset',
        readStorage: () => this.storage.asset,
        update: (value, update) => value.update(update),
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt256ToString(key.hash),
        createAddChange: (value) => ({ type: 'asset', value }),
      }),
      block: new BlockLikeStorageCache({
        name: 'block',
        readStorage: () => ({
          get: this.storage.block.get,
          tryGet: this.storage.block.tryGet,
        }),
        createAddChange: (value) => ({ type: 'block', value }),
      }),
      blockData: new ReadAddStorageCache({
        name: 'blockData',
        readStorage: () => this.storage.blockData,
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt256ToString(key.hash),
        createAddChange: (value) => ({ type: 'blockData', value }),
      }),
      header: new BlockLikeStorageCache({
        name: 'header',
        readStorage: () => ({
          get: this.storage.header.get,
          tryGet: this.storage.header.tryGet,
        }),
        createAddChange: (value) => ({ type: 'header', value }),
      }),
      transaction: new ReadAddStorageCache({
        name: 'transaction',
        readStorage: () => this.storage.transaction,
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt256ToString(key.hash),
        createAddChange: (value) => ({ type: 'transaction', value }),
        onAdd: async (value) => {
          await Promise.all(
            value.outputs.map(async (out, index) => output.add({ hash: value.hash, index, output: out })),
          );
        },
        allowDupes: true,
      }),
      transactionData: new ReadAddUpdateStorageCache({
        name: 'transactionData',
        readStorage: () => this.storage.transactionData,
        update: (value, update) => value.update(update),
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt256ToString(key.hash),
        createAddChange: (value) => ({ type: 'transactionData', value }),
        allowDupes: true,
      }),
      output,
      contract: new ReadAddDeleteStorageCache({
        name: 'contract',
        readStorage: () => this.storage.contract,
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt160ToString(key.hash),
        createAddChange: (value) => ({ type: 'contract', value }),
        createDeleteChange: (key) => ({ type: 'contract', key }),
      }),
      storageItem: new ReadGetAllAddUpdateDeleteStorageCache({
        name: 'storageItem',
        readGetAllStorage: () => this.storage.storageItem,
        update: (value, update) => value.update(update),
        getKeyFromValue: (value) => ({
          hash: value.hash,
          key: value.key,
        }),
        getKeyString: (key) => `${common.uInt160ToString(key.hash)}:${key.key.toString('hex')}`,
        matchesPartialKey: (value, key) =>
          (key.hash === undefined || common.uInt160Equal(value.hash, key.hash)) &&
          (key.prefix === undefined || key.prefix.every((byte, idx) => value.key[idx] === byte)),
        createAddChange: (value) => ({ type: 'storageItem', value }),
        createDeleteChange: (key) => ({ type: 'storageItem', key }),
      }),
      validator: new ReadAllAddUpdateDeleteStorageCache({
        name: 'validator',
        readAllStorage: () => this.storage.validator,
        getKeyFromValue: (value) => ({ publicKey: value.publicKey }),
        getKeyString: (key) => common.ecPointToString(key.publicKey),
        createAddChange: (value) => ({ type: 'validator', value }),
        update: (value, update) => value.update(update),
        createDeleteChange: (key) => ({ type: 'validator', key }),
      }),
      invocationData: new ReadAddStorageCache({
        name: 'invocationData',
        readStorage: () => this.storage.invocationData,
        getKeyFromValue: (value) => ({ hash: value.hash }),
        getKeyString: (key) => common.uInt256ToString(key.hash),
        createAddChange: (value) => ({ type: 'invocationData', value }),
      }),
      validatorsCount: new ReadAddUpdateMetadataStorageCache({
        name: 'validatorsCount',
        readStorage: () => this.storage.validatorsCount,
        createAddChange: (value) => ({ type: 'validatorsCount', value }),
        update: (value, update) => value.update(update),
      }),
    };

    this.account = this.caches.account;
    this.accountUnspent = this.caches.accountUnspent;
    this.accountUnclaimed = this.caches.accountUnclaimed;
    this.action = this.caches.action;
    this.asset = this.caches.asset;
    this.block = this.caches.block;
    this.blockData = this.caches.blockData;
    this.header = this.caches.header;
    this.transaction = this.caches.transaction;
    this.transactionData = this.caches.transactionData;
    this.output = this.caches.output;
    this.contract = this.caches.contract;
    this.storageItem = this.caches.storageItem;
    this.validator = this.caches.validator;
    this.invocationData = this.caches.invocationData;
    this.validatorsCount = this.caches.validatorsCount;
  }

  public get currentBlock(): Block {
    if (this.currentBlockInternal === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.currentBlockInternal;
  }

  public get currentBlockIndex(): number {
    return this.currentBlockInternal === undefined ? 0 : this.currentBlockInternal.index;
  }

  public get currentHeader(): Header {
    if (this.currentHeaderInternal === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.currentHeaderInternal;
  }

  public getChangeSet(): ChangeSet {
    return Object.values(this.caches).reduce<ChangeSet>((acc, cache) => acc.concat(cache.getChangeSet()), []);
  }

  // tslint:disable-next-line no-any
  public getTrackedChangeSet(): TrackedChangeSet<any, any, any> {
    // tslint:disable-next-line no-any
    return Object.values(this.caches).reduce<TrackedChangeSet<any, any, any>>(
      (acc, cache) => acc.concat(cache.getTrackedChangeSet()),
      [],
    );
  }

  public async persistBlock(monitorIn: Monitor, block: Block): Promise<void> {
    const monitor = monitorIn.at('write_blockchain').withData({
      [labels.NEO_BLOCK_INDEX]: block.index,
    });

    const [maybePrevBlockData, outputContractsList] = await monitor.captureSpan(
      async () =>
        Promise.all([
          block.index === 0 ? Promise.resolve(undefined) : this.blockData.get({ hash: block.previousHash }),
          Promise.all(
            [
              ...new Set(
                block.transactions.reduce<string[]>(
                  (acc, transaction) =>
                    acc.concat(transaction.outputs.map((output) => common.uInt160ToString(output.address))),

                  [],
                ),
              ),
            ].map(async (hash) => this.contract.tryGet({ hash: common.stringToUInt160(hash) })),
          ),

          this.block.add(block),
          this.header.add(block.header),
        ]),

      {
        name: 'neo_write_blockchain_stage_0',
      },
    );

    const prevBlockData =
      maybePrevBlockData === undefined
        ? {
            lastGlobalTransactionIndex: utils.NEGATIVE_ONE,
            lastGlobalActionIndex: utils.NEGATIVE_ONE,
            systemFee: utils.ZERO,
          }
        : {
            lastGlobalTransactionIndex: maybePrevBlockData.lastGlobalTransactionIndex,
            lastGlobalActionIndex: maybePrevBlockData.lastGlobalActionIndex,
            systemFee: maybePrevBlockData.systemFee,
          };

    const outputContracts: { [key: string]: Contract | undefined } = {};
    outputContractsList.filter(commonUtils.notNull).forEach((outputContract) => {
      outputContracts[outputContract.hashHex] = outputContract;
    });

    const [utxo, rest] = _.partition(
      block.transactions.map<[number, Transaction]>((transaction, idx) => [idx, transaction]),
      // tslint:disable-next-line no-unused
      ([idx, transaction]) =>
        ((transaction.type === TransactionType.Claim && transaction instanceof ClaimTransaction) ||
          (transaction.type === TransactionType.Contract && transaction instanceof ContractTransaction) ||
          (transaction.type === TransactionType.Miner && transaction instanceof MinerTransaction)) &&
        !transaction.outputs.some((output) => outputContracts[common.uInt160ToString(output.address)] !== undefined),
    );

    const [globalActionIndex] = await monitor.captureSpan(
      async (span) =>
        Promise.all([
          rest.length > 0
            ? this.persistTransactions(
                span,
                block,
                // tslint:disable-next-line no-any
                rest as any,
                prevBlockData.lastGlobalTransactionIndex,
                prevBlockData.lastGlobalActionIndex,
              )
            : Promise.resolve(prevBlockData.lastGlobalActionIndex),
          utxo.length > 0
            ? // tslint:disable-next-line no-any
              this.persistUTXOTransactions(span, block, utxo as any, prevBlockData.lastGlobalTransactionIndex)
            : Promise.resolve(),
        ]),

      {
        name: 'neo_write_blockchain_stage_1',
      },
    );

    await monitor.captureSpan(
      async () =>
        this.blockData.add(
          new BlockData({
            hash: block.hash,
            lastGlobalTransactionIndex: prevBlockData.lastGlobalTransactionIndex.add(new BN(block.transactions.length)),

            lastGlobalActionIndex: globalActionIndex,
            systemFee: prevBlockData.systemFee.add(
              block.getSystemFee({
                getOutput: this.output.get,
                governingToken: this.settings.governingToken,
                utilityToken: this.settings.utilityToken,
                fees: this.settings.fees,
                registerValidatorFee: this.settings.registerValidatorFee,
              }),
            ),
          }),
        ),

      { name: 'neo_write_blockchain_stage_2' },
    );
  }

  private async persistUTXOTransactions(
    monitor: Monitor,
    block: Block,
    transactions: ReadonlyArray<readonly [number, (ContractTransaction | ClaimTransaction | MinerTransaction)]>,
    lastGlobalTransactionIndex: BN,
  ): Promise<void> {
    await monitor.captureSpan(
      async (span) => {
        const inputs = [];
        const claims = [];
        const outputWithInputs = [];
        // tslint:disable-next-line no-unused no-loop-statement no-dead-store
        for (const idxAndTransaction of transactions) {
          const transaction = idxAndTransaction[1];
          inputs.push(...transaction.inputs);
          if (transaction.type === TransactionType.Claim && transaction instanceof ClaimTransaction) {
            claims.push(...transaction.claims);
          }
          outputWithInputs.push(...this.getOutputWithInput(transaction));
        }
        await Promise.all([
          Promise.all(
            // tslint:disable-next-line no-unused
            transactions.map(async ([idx, transaction]) => this.transaction.add(transaction)),
          ),
          Promise.all(
            transactions.map(async ([idx, transaction]) =>
              this.transactionData.add(
                new TransactionData({
                  hash: transaction.hash,
                  startHeight: block.index,
                  blockHash: block.hash,
                  index: idx,
                  globalIndex: lastGlobalTransactionIndex.add(new BN(idx + 1)),
                }),
              ),
            ),
          ),

          this.updateAccounts(span, inputs, claims, outputWithInputs),
          this.updateCoins(span, inputs, claims, block),
        ]);
      },
      {
        name: 'neo_write_blockchain_persist_utxo_transactions',
      },
    );
  }

  private async persistTransactions(
    monitor: Monitor,
    block: Block,
    transactions: ReadonlyArray<readonly [number, Transaction]>,
    lastGlobalTransactionIndex: BN,
    lastGlobalActionIndex: BN,
  ): Promise<BN> {
    return monitor.captureSpan(
      async (span) => {
        let globalActionIndex = lastGlobalActionIndex.add(utils.ONE);
        // tslint:disable-next-line no-loop-statement
        for (const [idx, transaction] of transactions) {
          globalActionIndex = await this.persistTransaction(
            span,
            block,
            transaction,
            idx,
            lastGlobalTransactionIndex,
            globalActionIndex,
          );
        }

        return globalActionIndex.sub(utils.ONE);
      },
      {
        name: 'neo_write_blockchain_persist_transactions',
      },
    );
  }

  private async persistTransaction(
    monitor: Monitor,
    block: Block,
    transactionIn: Transaction,
    transactionIndex: number,
    lastGlobalTransactionIndex: BN,
    globalActionIndexIn: BN,
  ): Promise<BN> {
    let globalActionIndex = globalActionIndexIn;
    await monitor
      .withLabels({ [labels.NEO_TRANSACTION_TYPE]: transactionIn.type })
      .withData({ [labels.NEO_TRANSACTION_HASH]: transactionIn.hashHex })
      .captureSpan(
        async (span) => {
          const transaction = transactionIn;
          const claims =
            transaction.type === TransactionType.Claim && transaction instanceof ClaimTransaction
              ? transaction.claims
              : [];
          let accountChanges = {};
          let validatorChanges = {};
          let validatorsCountChanges: ValidatorsCountChanges = [];
          if (transaction.type === TransactionType.State && transaction instanceof StateTransaction) {
            ({ accountChanges, validatorChanges, validatorsCountChanges } = await getDescriptorChanges({
              transactions: [transaction],
              getAccount: async (hash) =>
                this.account
                  .tryGet({ hash })
                  .then((account) => (account === undefined ? new Account({ hash }) : account)),

              governingTokenHash: this.settings.governingToken.hashHex,
            }));
          }
          await Promise.all([
            this.transaction.add(transaction),
            this.transactionData.add(
              new TransactionData({
                hash: transaction.hash,
                blockHash: block.hash,
                startHeight: block.index,
                index: transactionIndex,
                globalIndex: lastGlobalTransactionIndex.add(new BN(transactionIndex + 1)),
              }),
            ),

            this.updateAccounts(span, transaction.inputs, claims, this.getOutputWithInput(transaction), accountChanges),

            this.updateCoins(span, transaction.inputs, claims, block),
            this.processStateTransaction(span, validatorChanges, validatorsCountChanges),
          ]);

          if (transaction.type === TransactionType.Register && transaction instanceof RegisterTransaction) {
            await this.asset.add(
              new Asset({
                hash: transaction.hash,
                type: transaction.asset.type,
                name: transaction.asset.name,
                amount: transaction.asset.amount,
                precision: transaction.asset.precision,
                owner: transaction.asset.owner,
                admin: transaction.asset.admin,
                issuer: transaction.asset.admin,
                expiration: this.currentBlockIndex + 2 * 2000000,
                isFrozen: false,
              }),
            );
          } else if (transaction.type === TransactionType.Issue && transaction instanceof IssueTransaction) {
            const results = await Promise.all(
              Object.entries(
                transaction.getTransactionResults({
                  getOutput: this.output.get,
                }),
              ),
            );

            await Promise.all(
              results.map(async ([assetHex, value]) => {
                const hash = common.stringToUInt256(assetHex);
                const asset = await this.asset.get({ hash });
                await this.asset.update(asset, {
                  available: asset.available.add(value.neg()),
                });
              }),
            );
          } else if (transaction.type === TransactionType.Enrollment && transaction instanceof EnrollmentTransaction) {
            await this.validator.add(
              new Validator({
                publicKey: transaction.publicKey,
              }),
            );
          } else if (transaction.type === TransactionType.Publish && transaction instanceof PublishTransaction) {
            const contract = await this.contract.tryGet({
              hash: transaction.contract.hash,
            });

            if (contract === undefined) {
              await this.contract.add(transaction.contract);
            }
          } else if (transaction.type === TransactionType.Invocation && transaction instanceof InvocationTransaction) {
            const temporaryBlockchain = new WriteBatchBlockchain({
              settings: this.settings,
              currentBlock: this.currentBlockInternal,
              currentHeader: this.currentHeader,
              // tslint:disable-next-line no-any
              storage: this as any,
              vm: this.vm,
              getValidators: this.getValidators,
            });

            const migratedContractHashes: Array<readonly [UInt160, UInt160]> = [];
            const voteUpdates: Array<readonly [UInt160, ReadonlyArray<ECPoint>]> = [];
            const actions: Array<NotificationAction | LogAction> = [];
            const result = await wrapExecuteScripts(async () =>
              this.vm.executeScripts({
                monitor: span,
                scripts: [{ code: transaction.script }],
                blockchain: temporaryBlockchain,
                scriptContainer: {
                  type: ScriptContainerType.Transaction,
                  value: transaction,
                },

                triggerType: TriggerType.Application,
                action: {
                  blockIndex: block.index,
                  blockHash: block.hash,
                  transactionIndex,
                  transactionHash: transaction.hash,
                },

                gas: transaction.gas,
                listeners: {
                  onLog: ({ message, scriptHash }) => {
                    actions.push(
                      new LogAction({
                        index: globalActionIndex,
                        scriptHash,
                        message,
                      }),
                    );

                    globalActionIndex = globalActionIndex.add(utils.ONE);
                  },
                  onNotify: ({ args, scriptHash }) => {
                    actions.push(
                      new NotificationAction({
                        index: globalActionIndex,
                        scriptHash,
                        args,
                      }),
                    );

                    globalActionIndex = globalActionIndex.add(utils.ONE);
                  },
                  onMigrateContract: ({ from, to }) => {
                    migratedContractHashes.push([from, to] as const);
                  },
                  onSetVotes: ({ address, votes }) => {
                    voteUpdates.push([address, votes] as const);
                  },
                },

                persistingBlock: block,
              }),
            );

            const addActionsPromise = Promise.all(actions.map(async (action) => this.action.add(action)));

            if (result instanceof InvocationResultSuccess) {
              const assetChangeSet = temporaryBlockchain.asset.getChangeSet();
              const assetHash = assetChangeSet
                .map((change) =>
                  change.type === 'add' && change.change.type === 'asset' ? change.change.value.hash : undefined,
                )
                .find((value) => value !== undefined);

              const contractsChangeSet = temporaryBlockchain.contract.getChangeSet();
              const contractHashes = contractsChangeSet
                .map((change) =>
                  change.type === 'add' && change.change.type === 'contract' ? change.change.value.hash : undefined,
                )
                .filter(commonUtils.notNull);

              const deletedContractHashes = contractsChangeSet
                .map((change) =>
                  change.type === 'delete' && change.change.type === 'contract' ? change.change.key.hash : undefined,
                )
                .filter(commonUtils.notNull);

              const storageChanges = temporaryBlockchain.storageItem
                .getChangeSet()
                .map((change) => {
                  const addChange =
                    change.type === 'add' && change.change.type === 'storageItem'
                      ? { value: change.change.value, subType: change.subType }
                      : undefined;
                  if (addChange !== undefined) {
                    const options = {
                      hash: addChange.value.hash,
                      key: addChange.value.key,
                      value: addChange.value.value,
                    };

                    return addChange.subType === 'add'
                      ? new StorageChangeAdd(options)
                      : new StorageChangeModify(options);
                  }

                  const deleteChange =
                    change.type === 'delete' && change.change.type === 'storageItem' ? change.change.key : undefined;
                  if (deleteChange !== undefined) {
                    return new StorageChangeDelete(deleteChange);
                  }

                  return undefined;
                })
                .filter(commonUtils.notNull);

              temporaryBlockchain.getTrackedChangeSet().forEach((change) => {
                this.caches[change.type as keyof Caches].addTrackedChange(change.key, change.value);
              });
              await Promise.all([
                this.invocationData.add(
                  new InvocationData({
                    hash: transaction.hash,
                    assetHash,
                    contractHashes,
                    deletedContractHashes,
                    migratedContractHashes,
                    voteUpdates,
                    blockIndex: block.index,
                    transactionIndex,
                    actionIndexStart: globalActionIndexIn,
                    actionIndexStop: globalActionIndex,
                    result,
                    storageChanges,
                  }),
                ),
                addActionsPromise,
              ]);
            } else {
              await Promise.all([
                this.invocationData.add(
                  new InvocationData({
                    hash: transaction.hash,
                    assetHash: undefined,
                    contractHashes: [],
                    deletedContractHashes: [],
                    migratedContractHashes: [],
                    voteUpdates: [],
                    blockIndex: block.index,
                    transactionIndex,
                    actionIndexStart: globalActionIndexIn,
                    actionIndexStop: globalActionIndex,
                    result,
                    storageChanges: [],
                  }),
                ),
                addActionsPromise,
              ]);
            }
          }
        },
        {
          name: 'neo_write_blockchain_persist_single_transaction',
        },
      );

    return globalActionIndex;
  }

  private async processStateTransaction(
    monitor: Monitor,
    validatorChanges: ValidatorChanges,
    validatorsCountChanges: ValidatorsCountChanges,
  ): Promise<void> {
    await monitor.captureSpan(
      async () => {
        const validatorsCount = await this.validatorsCount.tryGet();
        const validatorsCountVotes = validatorsCount === undefined ? [] : [...validatorsCount.votes];
        // tslint:disable-next-line no-loop-statement
        for (const [index, value] of validatorsCountChanges.entries()) {
          validatorsCountVotes[index] = value;
        }

        await Promise.all([
          Promise.all(
            Object.entries(validatorChanges).map(async ([publicKeyHex, { registered, votes }]) => {
              const publicKey = common.hexToECPoint(publicKeyHex);
              const validator = await this.validator.tryGet({ publicKey });
              if (validator === undefined) {
                await this.validator.add(
                  new Validator({
                    publicKey,
                    registered,
                    votes,
                  }),
                );
              } else if (
                ((registered !== undefined && !registered) || (registered === undefined && !validator.registered)) &&
                ((votes !== undefined && votes.eq(utils.ZERO)) ||
                  (votes === undefined && validator.votes.eq(utils.ZERO)))
              ) {
                await this.validator.delete({ publicKey: validator.publicKey });
              } else {
                await this.validator.update(validator, { votes, registered });
              }
            }),
          ),
          validatorsCount === undefined
            ? this.validatorsCount.add(
                new ValidatorsCount({
                  votes: validatorsCountVotes,
                }),
              )
            : (async () => {
                await this.validatorsCount.update(validatorsCount, {
                  votes: validatorsCountVotes,
                });
              })(),
        ]);
      },
      {
        name: 'neo_write_blockchain_process_state_transaction',
      },
    );
  }

  private async updateAccounts(
    monitor: Monitor,
    inputs: readonly Input[],
    claims: readonly Input[],
    outputs: readonly OutputWithInput[],
    accountChanges: AccountChanges = {},
  ): Promise<void> {
    const [inputOutputs, claimOutputs] = await monitor.captureSpan(
      async () => Promise.all([this.getInputOutputs(inputs), this.getInputOutputs(claims)]),
      {
        name: 'neo_write_blockchain_update_accounts_get_input_outputs',
      },
    );

    await monitor.captureSpan(
      async () => {
        const addressValues = Object.entries(
          _.groupBy(
            inputOutputs
              .map<[UInt160, UInt256, BN]>(({ output }) => [output.address, output.asset, output.value.neg()])
              .concat(
                outputs.map<[UInt160, UInt256, BN]>(({ output }) => [output.address, output.asset, output.value]),
              ),
            ([address]) => common.uInt160ToHex(address),
          ),
        );

        const addressSpent = this.groupByAddress(inputOutputs);
        const addressClaimed = _.mapValues(this.groupByAddress(claimOutputs), (values) =>
          values.map(({ input }) => input),
        );

        const addressOutputs = _.groupBy(outputs, (output) => common.uInt160ToHex(output.output.address));

        await Promise.all(
          addressValues.map(async ([address, values]) => {
            const spent = addressSpent[address] as readonly OutputWithInput[] | undefined;
            const claimed = addressClaimed[address] as readonly Input[] | undefined;
            const outs = addressOutputs[address] as readonly OutputWithInput[] | undefined;
            const changes = accountChanges[address] as readonly ECPoint[] | undefined;
            await this.updateAccount(
              common.hexToUInt160(address),
              // tslint:disable-next-line no-unused
              values.map<readonly [UInt256, BN]>(([_address, asset, value]) => [asset, value] as const),
              spent === undefined ? [] : spent,
              claimed === undefined ? [] : claimed,
              outs === undefined ? [] : outs,
              changes === undefined ? [] : changes,
            );
          }),
        );
      },
      {
        name: 'neo_write_blockchain_update_accounts_process',
      },
    );
  }

  private getOutputWithInput(transaction: Transaction): readonly OutputWithInput[] {
    return transaction.outputs.map((output, index) => ({
      output,
      input: new Input({ hash: transaction.hash, index }),
    }));
  }

  private async getInputOutputs(
    inputs: readonly Input[],
  ): Promise<
    ReadonlyArray<{
      readonly input: Input;
      readonly output: Output;
    }>
  > {
    return Promise.all(
      inputs.map(async (input) => {
        const output = await this.output.get(input);

        return { input, output };
      }),
    );
  }

  private groupByAddress(
    inputOutputs: readonly OutputWithInput[],
  ): { readonly [key: string]: readonly OutputWithInput[] } {
    return _.groupBy(inputOutputs, ({ output }) => common.uInt160ToHex(output.address));
  }

  private async updateAccount(
    address: UInt160,
    values: ReadonlyArray<readonly [UInt256, BN]>,
    spent: readonly OutputWithInput[],
    claimed: readonly Input[],
    outputs: readonly OutputWithInput[],
    votes: readonly ECPoint[],
  ): Promise<void> {
    const account = await this.account.tryGet({ hash: address });

    const balances = values.reduce<{ [asset: string]: BN }>(
      (acc, [asset, value]) => {
        const key = common.uInt256ToHex(asset);
        if ((acc[key] as BN | undefined) === undefined) {
          acc[key] = utils.ZERO;
        }
        acc[key] = acc[key].add(value);

        return acc;
      },
      account === undefined
        ? {}
        : Object.entries(account.balances).reduce<{ [asset: string]: BN }>((acc, [key, value]) => {
            if (value === undefined) {
              return {
                ...acc,
                [key]: utils.ZERO,
              };
            }

            return {
              ...acc,
              [key]: value,
            };
          }, {}),
    );

    const promises = [];
    promises.push(
      ...spent.map(async ({ input }) =>
        this.accountUnspent.delete({
          hash: address,
          input,
        }),
      ),
    );

    promises.push(
      ...outputs.map(async ({ input }) => this.accountUnspent.add(new AccountUnspent({ hash: address, input }))),
    );

    promises.push(
      ...claimed.map(async (input) =>
        this.accountUnclaimed.delete({
          hash: address,
          input,
        }),
      ),
    );

    promises.push(
      ...spent
        .filter(({ output }) => common.uInt256Equal(output.asset, this.settings.governingToken.hash))
        .map(async ({ input }) => this.accountUnclaimed.add(new AccountUnclaimed({ hash: address, input }))),
    );

    if (account === undefined) {
      promises.push(
        this.account.add(
          new Account({
            hash: address,
            balances,
            votes,
          }),
        ),
      );
    } else {
      promises.push(
        this.account.update(account, { balances, votes }).then(async (newAccount) => {
          if (newAccount.isDeletable()) {
            await this.account.delete({ hash: address });
          }
        }),
      );
    }

    await Promise.all(promises);
  }

  private async updateCoins(
    monitor: Monitor,
    inputs: readonly Input[],
    claims: readonly Input[],
    block: Block,
  ): Promise<void> {
    await monitor.captureSpan(
      async () => {
        const inputClaims = inputs
          .map<InputClaim>((input) => ({ type: 'input', input, hash: input.hash }))
          .concat(claims.map<InputClaim>((input) => ({ type: 'claim', input, hash: input.hash })));

        const hashInputClaims = Object.entries(_.groupBy(inputClaims, ({ hash }) => common.uInt256ToHex(hash)));

        await Promise.all(
          hashInputClaims.map(async ([hash, values]) => this.updateCoin(common.hexToUInt256(hash), values, block)),
        );
      },
      {
        name: 'neo_write_blockchain_update_coins',
      },
    );
  }

  private async updateCoin(hash: UInt256, inputClaims: readonly InputClaim[], block: Block): Promise<void> {
    const spentCoins = await this.transactionData.get({ hash });
    const endHeights = { ...spentCoins.endHeights };
    const claimed = { ...spentCoins.claimed };
    // tslint:disable-next-line no-loop-statement
    for (const inputClaim of inputClaims) {
      if (inputClaim.type === 'input') {
        endHeights[inputClaim.input.index] = block.index;
      } else {
        claimed[inputClaim.input.index] = true;
      }
    }

    await this.transactionData.update(spentCoins, {
      endHeights,
      claimed,
    });
  }
}
