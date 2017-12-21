/* @flow */
import type BN from 'bn.js';

import {
  SCRIPT_CONTAINER_TYPE,
  TRANSACTION_TYPE,
  type AccountKey,
  type AccountUpdate,
  type Action,
  type ActionKey,
  type ActionsKey,
  type AssetKey,
  type AssetUpdate,
  type Block,
  type Contract,
  type ContractKey,
  type Header,
  type InvocationDataKey,
  type Output,
  type StorageItem,
  type StorageItemKey,
  type StorageItemsKey,
  type StorageItemUpdate,
  type Transaction,
  type TransactionKey,
  type ValidatorKey,
  type UInt160,
  type UInt160Hex,
  type UInt256,
  Account,
  Asset,
  ClaimTransaction,
  RegisterTransaction,
  Input,
  InvocationData,
  InvocationResultSuccess,
  IssueTransaction,
  EnrollmentTransaction,
  PublishTransaction,
  InvocationTransaction,
  Validator,
  common,
  utils,
} from '@neo-one/core';
import {
  TRIGGER_TYPE,
  type BlockSystemFeeKey,
  type OnStep,
  type TransactionSpentCoinsKey,
  type TransactionSpentCoinsUpdate,
  type ChangeSet,
  type Storage,
  type VM,
  type WriteBlockchain,
  BlockSystemFee,
  TransactionSpentCoins,
} from '@neo-one/node-core';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import {
  BlockLikeStorageCache,
  OutputStorageCache,
  ReadAddDeleteStorageCache,
  ReadAddUpdateStorageCache,
  ReadAddStorageCache,
  ReadGetAllAddUpdateDeleteStorageCache,
  ReadGetAllAddStorageCache,
  ReadAllAddUpdateDeleteStorageCache,
  ReadAllAddStorageCache,
} from './StorageCache';
import { GenesisBlockNotRegisteredError } from './errors';

import wrapExecuteScripts from './wrapExecuteScripts';

type WriteBatchBlockchainOptions = {|
  log: $PropertyType<WriteBlockchain, 'log'>,
  settings: $PropertyType<WriteBlockchain, 'settings'>,
  currentBlock: ?$PropertyType<WriteBlockchain, 'currentBlock'>,
  currentHeader: ?$PropertyType<WriteBlockchain, 'currentHeader'>,
  storage: Storage,
  vm: VM,
  onStep: OnStep,
  getValidators: $PropertyType<WriteBlockchain, 'getValidators'>,
|};

type Caches = {|
  account: ReadAllAddUpdateDeleteStorageCache<
    AccountKey,
    Account,
    AccountUpdate,
  >,
  action: ReadGetAllAddStorageCache<ActionKey, ActionsKey, Action>,
  asset: ReadAddUpdateStorageCache<AssetKey, Asset, AssetUpdate>,
  block: BlockLikeStorageCache<Block>,
  blockSystemFee: ReadAddStorageCache<BlockSystemFeeKey, BlockSystemFee>,
  header: BlockLikeStorageCache<Header>,
  transaction: ReadAddStorageCache<TransactionKey, Transaction>,
  transactionSpentCoins: ReadAddUpdateStorageCache<
    TransactionSpentCoinsKey,
    TransactionSpentCoins,
    TransactionSpentCoinsUpdate,
  >,
  output: OutputStorageCache,
  contract: ReadAddDeleteStorageCache<ContractKey, Contract>,
  storageItem: ReadGetAllAddUpdateDeleteStorageCache<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate,
  >,
  validator: ReadAllAddStorageCache<ValidatorKey, Validator>,
  invocationData: ReadAddStorageCache<InvocationDataKey, InvocationData>,
|};

type InputClaim = {|
  type: 'claim' | 'input',
  hash: UInt256,
  input: Input,
|};

export default class WriteBatchBlockchain {
  log: $PropertyType<WriteBlockchain, 'log'>;
  settings: $PropertyType<WriteBlockchain, 'settings'>;
  _currentBlock: ?$PropertyType<WriteBlockchain, 'currentBlock'>;
  _currentHeader: ?$PropertyType<WriteBlockchain, 'currentHeader'>;
  _storage: Storage;
  _vm: VM;
  _onStep: OnStep;

  _caches: Caches;
  account: ReadAllAddUpdateDeleteStorageCache<
    AccountKey,
    Account,
    AccountUpdate,
  >;
  action: ReadGetAllAddStorageCache<ActionKey, ActionsKey, Action>;
  asset: ReadAddUpdateStorageCache<AssetKey, Asset, AssetUpdate>;
  block: BlockLikeStorageCache<Block>;
  blockSystemFee: ReadAddStorageCache<BlockSystemFeeKey, BlockSystemFee>;
  header: BlockLikeStorageCache<Header>;
  transaction: ReadAddStorageCache<TransactionKey, Transaction>;
  transactionSpentCoins: ReadAddUpdateStorageCache<
    TransactionSpentCoinsKey,
    TransactionSpentCoins,
    TransactionSpentCoinsUpdate,
  >;
  output: OutputStorageCache;
  contract: ReadAddDeleteStorageCache<ContractKey, Contract>;
  storageItem: ReadGetAllAddUpdateDeleteStorageCache<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate,
  >;
  validator: ReadAllAddStorageCache<ValidatorKey, Validator>;
  invocationData: ReadAddStorageCache<InvocationDataKey, InvocationData>;

  getValidators: $PropertyType<WriteBlockchain, 'getValidators'>;

  constructor(options: WriteBatchBlockchainOptions) {
    this.log = options.log;
    this.settings = options.settings;
    this._currentBlock = options.currentBlock;
    this._currentHeader = options.currentHeader;
    this._storage = options.storage;
    this._vm = options.vm;
    this._onStep = options.onStep;
    this.getValidators = options.getValidators;

    const output = new OutputStorageCache(this._storage.output);
    this._caches = {
      account: new ReadAllAddUpdateDeleteStorageCache({
        name: 'account',
        readAllStorage: this._storage.account,
        update: (value, update) => value.update(update),
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt160ToString(key.hash),
        createAddChange: value => ({ type: 'account', value }),
        createDeleteChange: key => ({ type: 'account', key }),
      }),
      action: new ReadGetAllAddStorageCache({
        name: 'action',
        readGetAllStorage: this._storage.action,
        getKeyFromValue: value => ({
          blockIndex: value.blockIndex,
          transactionIndex: value.transactionIndex,
          index: value.index,
        }),
        getKeyString: key =>
          `${key.blockIndex}:${key.transactionIndex}:${key.index}`,
        // eslint-disable-next-line
        matchesPartialKey: (value, key) => {
          // TODO: Implement me
          throw new Error('Not implemented');
        },
        createAddChange: value => ({ type: 'action', value }),
      }),
      asset: new ReadAddUpdateStorageCache({
        name: 'asset',
        readStorage: this._storage.asset,
        update: (value, update) => value.update(update),
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt256ToString(key.hash),
        createAddChange: value => ({ type: 'asset', value }),
      }),
      block: new BlockLikeStorageCache({
        name: 'block',
        readStorage: {
          get: this._storage.block.get,
          tryGet: this._storage.block.tryGet,
        },
        createAddChange: value => ({ type: 'block', value }),
      }),
      blockSystemFee: new ReadAddStorageCache({
        name: 'blockSystemFee',
        readStorage: this._storage.blockSystemFee,
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt256ToString(key.hash),
        createAddChange: value => ({ type: 'blockSystemFee', value }),
      }),
      header: new BlockLikeStorageCache({
        name: 'header',
        readStorage: {
          get: this._storage.header.get,
          tryGet: this._storage.header.tryGet,
        },
        createAddChange: value => ({ type: 'header', value }),
      }),
      transaction: new ReadAddStorageCache({
        name: 'transaction',
        readStorage: this._storage.transaction,
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt256ToString(key.hash),
        createAddChange: value => ({ type: 'transaction', value }),
        onAdd: async value => {
          await Promise.all(
            value.outputs.map((out, index) =>
              output.add({ hash: value.hash, index, output: out }),
            ),
          );
        },
      }),
      transactionSpentCoins: new ReadAddUpdateStorageCache({
        name: 'transactionSpentCoins',
        readStorage: this._storage.transactionSpentCoins,
        update: (value, update) => value.update(update),
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt256ToString(key.hash),
        createAddChange: value => ({ type: 'transactionSpentCoins', value }),
      }),
      output,
      contract: new ReadAddDeleteStorageCache({
        name: 'contract',
        readStorage: this._storage.contract,
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt160ToString(key.hash),
        createAddChange: value => ({ type: 'contract', value }),
        createDeleteChange: key => ({ type: 'contract', key }),
      }),
      storageItem: new ReadGetAllAddUpdateDeleteStorageCache({
        name: 'storageItem',
        readGetAllStorage: this._storage.storageItem,
        update: (value, update) => value.update(update),
        getKeyFromValue: value => ({
          hash: value.hash,
          key: value.key,
        }),
        getKeyString: key =>
          `${common.uInt160ToString(key.hash)}:${key.key.toString('hex')}`,
        matchesPartialKey: (value, key) =>
          key.hash == null || common.uInt160Equal(value.hash, key.hash),
        createAddChange: value => ({ type: 'storageItem', value }),
        createDeleteChange: key => ({ type: 'storageItem', key }),
      }),
      validator: new ReadAllAddStorageCache({
        name: 'validator',
        readAllStorage: this._storage.validator,
        getKeyFromValue: value => ({ publicKey: value.publicKey }),
        getKeyString: key => common.ecPointToString(key.publicKey),
        createAddChange: value => ({ type: 'validator', value }),
      }),
      invocationData: new ReadAddStorageCache({
        name: 'invocationData',
        readStorage: this._storage.invocationData,
        getKeyFromValue: value => ({ hash: value.hash }),
        getKeyString: key => common.uInt256ToString(key.hash),
        createAddChange: value => ({ type: 'invocationData', value }),
      }),
    };

    this.account = this._caches.account;
    this.action = this._caches.action;
    this.asset = this._caches.asset;
    this.block = this._caches.block;
    this.blockSystemFee = this._caches.blockSystemFee;
    this.header = this._caches.header;
    this.transaction = this._caches.transaction;
    this.transactionSpentCoins = this._caches.transactionSpentCoins;
    this.output = this._caches.output;
    this.contract = this._caches.contract;
    this.storageItem = this._caches.storageItem;
    this.validator = this._caches.validator;
    this.invocationData = this._caches.invocationData;
  }

  get currentBlock(): Block {
    if (this._currentBlock == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentBlock;
  }

  get currentBlockIndex(): number {
    return this._currentBlock == null ? 0 : this._currentBlock.index;
  }

  get currentHeader(): Header {
    if (this._currentHeader == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentHeader;
  }

  getChangeSet(): ChangeSet {
    return this.account
      .getChangeSet()
      .concat(this.asset.getChangeSet())
      .concat(this.action.getChangeSet())
      .concat(this.block.getChangeSet())
      .concat(this.blockSystemFee.getChangeSet())
      .concat(this.header.getChangeSet())
      .concat(this.transaction.getChangeSet())
      .concat(this.output.getChangeSet())
      .concat(this.transactionSpentCoins.getChangeSet())
      .concat(this.contract.getChangeSet())
      .concat(this.storageItem.getChangeSet())
      .concat(this.validator.getChangeSet())
      .concat(this.invocationData.getChangeSet());
  }

  async persistBlock(block: Block): Promise<void> {
    // eslint-disable-next-line
    const [systemFee, _] = await Promise.all([
      block.index === 0
        ? Promise.resolve(utils.ZERO)
        : this.blockSystemFee
            .get({ hash: block.previousHash })
            .then(blockSystemFee => blockSystemFee.systemFee),
      this.block.add(block),
      this.header.add(block.header),
    ]);
    await this.blockSystemFee.add(
      new BlockSystemFee({
        hash: block.hash,
        systemFee: systemFee.add(
          block.getSystemFee({
            getOutput: this.output.get,
            governingToken: this.settings.governingToken,
            utilityToken: this.settings.utilityToken,
            fees: this.settings.fees,
          }),
        ),
      }),
    );
    for (const [idx, transaction] of block.transactions.entries()) {
      // eslint-disable-next-line
      await this._persistTransaction(block, transaction, idx);
    }
  }

  async _persistTransaction(
    block: Block,
    transactionIn: Transaction,
    transactionIndex: number,
  ): Promise<void> {
    const transaction = transactionIn;
    const claims =
      transaction.type === TRANSACTION_TYPE.CLAIM &&
      transaction instanceof ClaimTransaction
        ? transaction.claims
        : [];
    await Promise.all([
      this.transaction.add(transaction),
      this.transactionSpentCoins.add(
        new TransactionSpentCoins({
          hash: transaction.hash,
          startHeight: block.index,
        }),
      ),
      this._updateAccounts(
        transaction.inputs,
        claims,
        transaction.outputs,
        transaction,
      ),
      this._updateCoins(transaction.inputs, claims, block),
    ]);

    if (
      transaction.type === TRANSACTION_TYPE.REGISTER &&
      transaction instanceof RegisterTransaction
    ) {
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
    } else if (
      transaction.type === TRANSACTION_TYPE.ISSUE &&
      transaction instanceof IssueTransaction
    ) {
      const results = await commonUtils.entries(
        transaction.getTransactionResults({
          getOutput: this.output.get,
        }),
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
    } else if (
      transaction.type === TRANSACTION_TYPE.ENROLLMENT &&
      transaction instanceof EnrollmentTransaction
    ) {
      await this.validator.add(
        new Validator({
          publicKey: transaction.publicKey,
        }),
      );
    } else if (
      transaction.type === TRANSACTION_TYPE.PUBLISH &&
      transaction instanceof PublishTransaction
    ) {
      const contract = await this.contract.tryGet({
        hash: transaction.contract.hash,
      });
      if (contract == null) {
        await this.contract.add(transaction.contract);
      }
    } else if (
      transaction.type === TRANSACTION_TYPE.INVOCATION &&
      transaction instanceof InvocationTransaction
    ) {
      // TODO: Make this less hacky.
      const temporaryBlockchain = new WriteBatchBlockchain({
        log: this.log,
        settings: this.settings,
        currentBlock: this._currentBlock,
        currentHeader: this._currentHeader,
        storage: (this: $FlowFixMe),
        vm: this._vm,
        onStep: this._onStep,
        getValidators: this.getValidators,
      });
      const migratedContractHashes = [];
      const voteUpdates = [];
      const result = await wrapExecuteScripts(() =>
        this._vm.executeScripts({
          scripts: [{ code: transaction.script }],
          blockchain: temporaryBlockchain,
          scriptContainer: {
            type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
            value: transaction,
          },
          triggerType: TRIGGER_TYPE.APPLICATION,
          action: {
            blockIndex: block.index,
            blockHash: block.hash,
            transactionIndex,
            transactionHash: transaction.hash,
          },
          gas: transaction.gas,
          onStep: this._onStep,
          listeners: {
            onMigrateContract: ({ from, to }) => {
              migratedContractHashes.push([from, to]);
            },
            onSetVotes: ({ address, votes }) => {
              voteUpdates.push([address, votes]);
            },
          },
          persistingBlock: block,
        }),
      );
      if (result instanceof InvocationResultSuccess) {
        const assetChangeSet = temporaryBlockchain.asset.getChangeSet();
        const assetHash = assetChangeSet
          .map(
            change =>
              change.type === 'add' && change.change.type === 'asset'
                ? change.change.value.hash
                : null,
          )
          .find(value => value != null);
        const contractsChangeSet = temporaryBlockchain.contract.getChangeSet();
        const contractHashes = contractsChangeSet
          .map(
            change =>
              change.type === 'add' && change.change.type === 'contract'
                ? change.change.value.hash
                : null,
          )
          .filter(Boolean);
        const deletedContractHashes = contractsChangeSet
          .map(
            change =>
              change.type === 'delete' && change.change.type === 'contract'
                ? change.change.key.hash
                : null,
          )
          .filter(Boolean);
        const validatorsChangeSet = temporaryBlockchain.validator.getChangeSet();
        const validatorPublicKeys = validatorsChangeSet
          .map(
            change =>
              change.type === 'add' && change.change.type === 'validator'
                ? change.change.value.publicKey
                : null,
          )
          .filter(Boolean);
        await Promise.all([
          Promise.all(
            temporaryBlockchain.getChangeSet().map(async change => {
              if (change.type === 'add') {
                await this._caches[change.change.type].add(
                  (change.change.value: $FlowFixMe),
                  true,
                );
              } else if (change.type === 'delete') {
                await this._caches[change.change.type].delete(
                  (change.change.key: $FlowFixMe),
                );
              }
            }),
          ),
          this.invocationData.add(
            new InvocationData({
              hash: transaction.hash,
              assetHash,
              contractHashes,
              deletedContractHashes,
              migratedContractHashes,
              validatorPublicKeys,
              voteUpdates,
              blockIndex: block.index,
              transactionIndex,
              result,
            }),
          ),
        ]);
      } else {
        await this.invocationData.add(
          new InvocationData({
            hash: transaction.hash,
            assetHash: undefined,
            contractHashes: [],
            deletedContractHashes: [],
            migratedContractHashes: [],
            voteUpdates: [],
            validatorPublicKeys: [],
            blockIndex: block.index,
            transactionIndex,
            result,
          }),
        );
      }
    }
  }

  async _updateAccounts(
    inputs: Array<Input>,
    claims: Array<Input>,
    outputs: Array<Output>,
    transaction: Transaction,
  ): Promise<void> {
    const [inputOutputs, claimOutputs] = await Promise.all([
      this._getInputOutputs(inputs),
      this._getInputOutputs(claims),
    ]);

    const addressValues = commonUtils.entries(
      _.groupBy(
        inputOutputs
          .map(({ output }) => [
            output.address,
            output.asset,
            output.value.neg(),
          ])
          .concat(
            outputs.map(output => [output.address, output.asset, output.value]),
          ),
        // eslint-disable-next-line
        ([address, asset, value]) => common.uInt160ToHex(address),
      ),
    );
    const addressSpent = this._groupByAddress(inputOutputs);
    const addressClaimed = this._groupByAddress(claimOutputs);
    const addressOutputs = _.groupBy(
      outputs,
      // eslint-disable-next-line
      output => common.uInt160ToHex(output.address),
    );

    await Promise.all(
      addressValues.map(([address, values]) =>
        this._updateAccount(
          common.hexToUInt160(address),
          // eslint-disable-next-line
          values.map(([_, asset, value]) => [asset, value]),
          addressSpent[address] || [],
          addressClaimed[address] || [],
          transaction,
          addressOutputs[address] || [],
        ),
      ),
    );
  }

  async _getInputOutputs(
    inputs: Array<Input>,
  ): Promise<
    Array<{|
      input: Input,
      output: Output,
    |}>,
  > {
    return Promise.all(
      inputs.map(async input => {
        const output = await this.output.get(input);
        return { input, output };
      }),
    );
  }

  _groupByAddress(
    inputOutputs: Array<{|
      input: Input,
      output: Output,
    |}>,
  ): { [key: UInt160Hex]: Array<Input> } {
    const addressInputOutputs = _.groupBy(
      inputOutputs,
      // eslint-disable-next-line
      ({ output }) => common.uInt160ToHex(output.address),
    );
    return _.mapValues(addressInputOutputs, inputs =>
      inputs.map(({ input }) => input),
    );
  }

  async _updateAccount(
    address: UInt160,
    values: Array<[UInt256, BN]>,
    spent: Array<Input>,
    claimed: Array<Input>,
    transaction: Transaction,
    outputs: Array<Output>,
  ): Promise<void> {
    const account = await this.account.tryGet({ hash: address });

    const balances = values.reduce((acc, [asset, value]) => {
      const key = (common.uInt256ToHex(asset): $FlowFixMe);
      if (acc[key] == null) {
        acc[key] = utils.ZERO;
      }
      acc[key] = acc[key].add(value);
      return acc;
    }, account == null ? {} : account.balances);

    const spentSet = new Set(spent.map(input => this._getInputKey(input)));
    const unspent = (account == null ? [] : account.unspent)
      .filter(input => !spentSet.has(this._getInputKey(input)))
      .concat(
        outputs.map(
          (output, idx) =>
            new Input({
              hash: transaction.hash,
              index: idx,
            }),
        ),
      );

    const claimedSet = new Set(claimed.map(claim => this._getInputKey(claim)));
    const unclaimed = (account == null ? [] : account.unclaimed)
      .filter(claim => !claimedSet.has(this._getInputKey(claim)))
      .concat(spent);

    if (account == null) {
      await this.account.add(
        new Account({
          hash: address,
          balances,
          unspent,
          unclaimed,
        }),
      );
    } else {
      const newAccount = await this.account.update(account, {
        balances,
        unspent,
        unclaimed,
      });
      if (newAccount.isDeletable()) {
        await this.account.delete({ hash: address });
      }
    }
  }

  _getInputKey(input: Input): string {
    return `${common.uInt256ToString(input.hash)}:${input.index}`;
  }

  async _updateCoins(
    inputs: Array<Input>,
    claims: Array<Input>,
    block: Block,
  ): Promise<void> {
    const inputClaims = inputs
      .map(input => ({ type: 'input', input, hash: input.hash }))
      .concat(
        claims.map(input => ({ type: 'claim', input, hash: input.hash })),
      );
    const hashInputClaims = commonUtils.entries(
      _.groupBy(inputClaims, ({ hash }) => common.uInt256ToHex(hash)),
    );

    await Promise.all(
      hashInputClaims.map(([hash, values]) =>
        this._updateCoin(common.hexToUInt256(hash), values, block),
      ),
    );
  }

  async _updateCoin(
    hash: UInt256,
    inputClaims: Array<InputClaim>,
    block: Block,
  ): Promise<void> {
    const spentCoins = await this.transactionSpentCoins.get({ hash });
    const endHeights = { ...spentCoins.endHeights };
    const claimed = { ...spentCoins.claimed };
    for (const inputClaim of inputClaims) {
      if (inputClaim.type === 'input') {
        endHeights[inputClaim.input.index] = block.index;
      } else {
        claimed[inputClaim.input.index] = true;
      }
    }

    await this.transactionSpentCoins.update(spentCoins, {
      endHeights,
      claimed,
    });
  }
}

/*

Possibly broken on TestNet:
if (
  block.index !== 31331 && // Just seems like a bad script - unknown op
  block.index !== 62024 && // Invalid order for Account arguments
  block.index !== 131854 && // Calls contract without storage
  block.index !== 163432 && // Calls contract without storage
  block.index !== 163446 && // Calls contract without storage
  block.index !== 163457 && // Calls contract without storage
  block.index !== 163470 && // Calls contract without storage
  block.index !== 163484 && // Calls contract without storage
  block.index !== 163491 && // Calls contract without storage
  block.index !== 163512 && // Calls contract without storage
  block.index !== 460363 && // PICKITEM on non-array.
  block.index !== 460376 && // PICKITEM on non-array.
  block.index !== 460393 && // PICKITEM on non-array.
  block.index !== 460410 && // PICKITEM on non-array.
  block.index !== 561159 && // Bug in contract code - no inputs for transaction
  block.index !== 568381 && // Bug in contract code - no inputs for transaction
  block.index !== 572375 && // Bug in contract code - no inputs for transaction
  block.index !== 608107 && // Unknown OP 0xDB (219)
  block.index !== 608111 && // Unknown OP 0xDB (219)
  block.index !== 608135 && // Unknown OP 0x70 (112)
  block.index !== 609278 && // Unknown OP 0x70 (112)
  block.index !== 609402 && // Unknown OP 0x70 (112)
  block.index !== 609408 && // Unknown OP 0x70 (112)
  block.index !== 609504 &&
  block.index !== 609513 && // Unknown op: 0x70 (112)
  block.index !== 637192 && // Seems like a bad argument to CheckWitness
  !error.message.includes('Unknown op: 112') &&
  !error.message.includes('Script execution threw an Error')
) {
  console.log(block.index);
  console.error(error);
  throw error;
}

*/
