/* @flow */
import BN from 'bn.js';
import {
  VM_STATE,
  type AccountJSON,
  type ActionJSON,
  type AssetJSON,
  type AttributeJSON,
  type BlockJSON,
  type ContractJSON,
  type ContractParameterJSON,
  type InvocationDataJSON,
  type InvocationResultJSON,
  type InvocationTransactionJSON,
  type OutputJSON,
  type NetworkSettingsJSON,
  type Param as ScriptBuilderParam,
  type TransactionJSON,
  type ValidatorJSON,
  InvocationTransaction as CoreInvocationTransaction,
  utils,
} from '@neo-one/client-core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';
import type { Monitor } from '@neo-one/monitor';

import _ from 'lodash';
import { flatten, flatMap } from 'ix/asynciterable/pipe/index';

import type {
  Account,
  ActionRaw,
  AddressString,
  Asset,
  Attribute,
  Block,
  BlockFilter,
  BufferString,
  CommonTransaction,
  ConfirmedInvocationTransaction,
  ConfirmedTransaction,
  Contract,
  ContractParameter,
  DataProvider,
  DeveloperProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Input,
  InvocationTransaction,
  RawInvocationData,
  RawInvocationResult,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  StorageItem,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
  Validator,
  Options,
} from '../../types';
import AsyncBlockIterator from '../../AsyncBlockIterator';
import JSONRPCClient from './JSONRPCClient';
import JSONRPCHTTPProvider from './JSONRPCHTTPProvider';

import * as clientUtils from '../../utils';

export type NEOONEDataProviderOptions = {|
  network: NetworkType,
  rpcURL: string,
  iterBlocksFetchTimeoutMS?: number,
  iterBlocksBatchSize?: number,
|};

export default class NEOONEDataProvider
  implements DataProvider, DeveloperProvider {
  network: NetworkType;

  _client: JSONRPCClient;
  _iterBlocksFetchTimeoutMS: number | void;
  _iterBlocksBatchSize: number | void;

  constructor({
    network,
    rpcURL,
    iterBlocksFetchTimeoutMS,
    iterBlocksBatchSize,
  }: NEOONEDataProviderOptions) {
    this.network = network;
    this._client = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
    this._iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this._iterBlocksBatchSize = iterBlocksBatchSize;
  }

  setRPCURL(rpcURL: string): void {
    this._client = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  getUnclaimed(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{| unclaimed: Array<Input>, amount: BigNumber |}> {
    return this._capture(
      async span => {
        const account = await this._getAccount(address, span);
        const amounts = await Promise.all(
          account.unclaimed.map(input =>
            this._client.getClaimAmount(input, span),
          ),
        );

        return {
          unclaimed: account.unclaimed,
          amount: amounts.reduce(
            (acc, amount) => acc.plus(amount),
            utils.ZERO_BIG_NUMBER,
          ),
        };
      },
      'neo_get_unclaimed',
      monitor,
    );
  }

  async getUnspentOutputs(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<Array<UnspentOutput>> {
    return this._capture(
      async span => {
        const account = await this._getAccount(address, span);
        const outputs = await Promise.all(
          account.unspent.map(async (input): Promise<?UnspentOutput> => {
            const outputJSON = await this._client.getUnspentOutput(input, span);
            if (outputJSON == null) {
              return null;
            }

            const output = this._convertOutput(outputJSON);

            return {
              asset: output.asset,
              value: output.value,
              address: output.address,
              txid: input.txid,
              vout: input.vout,
            };
          }),
        );

        return outputs.filter(Boolean);
      },
      'neo_get_unspent',
      monitor,
    );
  }

  async relayTransaction(
    transaction: string,
    monitor?: Monitor,
  ): Promise<Transaction> {
    const result = await this._client.relayTransaction(transaction, monitor);
    return this._convertTransaction(result);
  }

  getTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this._client.getTransactionReceipt(hash, options);
  }

  async getInvocationData(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<RawInvocationData> {
    const result = await this._client.getInvocationData(hash, monitor);
    return this._convertInvocationData(result);
  }

  async testInvoke(
    transaction: string,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    const result = await this._client.testInvocation(transaction, monitor);
    return this._convertInvocationResult(result);
  }

  async getAccount(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<Account> {
    const account = await this._getAccount(address, monitor);
    return {
      address,
      frozen: account.frozen,
      votes: account.votes,
      balances: account.balances.reduce((acc, { asset, value }) => {
        acc[asset] = new BigNumber(value);
        return acc;
      }, {}),
    };
  }

  async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    const asset = await this._client.getAsset(hash, monitor);
    return this._convertAsset(asset);
  }

  async getBlock(
    hashOrIndex: Hash256String | number,
    options?: GetOptions,
  ): Promise<Block> {
    const block = await this._client.getBlock(hashOrIndex, options);
    return this._convertBlock(block);
  }

  iterBlocks(filter?: BlockFilter): AsyncIterable<Block> {
    return AsyncIterableX.from(
      new AsyncBlockIterator({
        client: this,
        filter: filter || {},
        fetchTimeoutMS: this._iterBlocksFetchTimeoutMS,
        batchSize: this._iterBlocksBatchSize,
      }),
    );
  }

  getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this._client.getBestBlockHash(monitor);
  }

  getBlockCount(monitor?: Monitor): Promise<number> {
    return this._client.getBlockCount(monitor);
  }

  async getContract(hash: Hash160String, monitor?: Monitor): Promise<Contract> {
    const contract = await this._client.getContract(hash, monitor);
    return this._convertContract(contract);
  }

  getMemPool(monitor?: Monitor): Promise<Array<Hash256String>> {
    return this._client.getMemPool(monitor);
  }

  async getTransaction(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<Transaction> {
    const transaction = await this._client.getTransaction(hash, monitor);
    return this._convertTransaction(transaction);
  }

  getValidators(monitor?: Monitor): Promise<Array<Validator>> {
    return this._client
      .getValidators(monitor)
      .then(validators =>
        validators.map(validator => this._convertValidator(validator)),
      );
  }

  getConnectedPeers(monitor?: Monitor): Promise<Array<Peer>> {
    return this._client.getConnectedPeers(monitor);
  }

  async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettings> {
    const settings = await this._client.getNetworkSettings(monitor);
    return this._convertNetworkSettings(settings);
  }

  getStorage(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItem> {
    return this._client.getStorageItem(hash, key, monitor);
  }

  iterStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this._client
        .getAllStorage(hash, monitor)
        .then(res => AsyncIterableX.from(res)),
    ).pipe(flatten());
  }

  iterActionsRaw(filterIn?: BlockFilter): AsyncIterable<ActionRaw> {
    const filter = filterIn || {};
    return AsyncIterableX.from(
      this.iterBlocks({
        indexStart: filter.indexStart,
        indexStop: filter.indexStop,
        monitor: filter.monitor,
      }),
    ).pipe(
      flatMap(async block => {
        const actions = _.flatten(
          block.transactions.map(transaction => {
            if (transaction.type === 'InvocationTransaction') {
              return transaction.data.actions;
            }

            return [];
          }),
        );
        return AsyncIterableX.of(...actions);
      }),
    );
  }

  call(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    const testTransaction = new CoreInvocationTransaction({
      version: 1,
      gas: utils.ZERO,
      script: clientUtils.getInvokeMethodScript({
        hash: contract,
        method,
        params,
      }),
    });
    return this.testInvoke(
      testTransaction.serializeWire().toString('hex'),
      monitor,
    );
  }

  runConsensusNow(monitor?: Monitor): Promise<void> {
    return this._client.runConsensusNow(monitor);
  }

  updateSettings(options: Options, monitor?: Monitor): Promise<void> {
    return this._client.updateSettings(options, monitor);
  }

  fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this._client.fastForwardOffset(seconds, monitor);
  }

  fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this._client.fastForwardToTime(seconds, monitor);
  }

  _convertBlock(block: BlockJSON): Block {
    return {
      version: block.version,
      hash: block.hash,
      previousBlockHash: block.previousblockhash,
      merkleRoot: block.merkleroot,
      time: block.time,
      index: block.index,
      nonce: block.nonce,
      nextConsensus: block.nextconsensus,
      script: block.script,
      size: block.size,
      transactions: block.tx.map(transaction =>
        this._convertConfirmedTransaction(transaction),
      ),
    };
  }

  _convertTransaction(transaction: TransactionJSON): Transaction {
    return this._convertTransactionBase(transaction, invocation => ({
      type: 'InvocationTransaction',
      txid: invocation.txid,
      size: invocation.size,
      version: invocation.version,
      attributes: this._convertAttributes(invocation.attributes),
      vin: invocation.vin,
      vout: this._convertOutputs(invocation.vout),
      scripts: invocation.scripts,
      systemFee: new BigNumber(invocation.sys_fee),
      networkFee: new BigNumber(invocation.net_fee),
      script: invocation.script,
      gas: new BigNumber(invocation.gas),
    }));
  }

  _convertConfirmedTransaction(
    transaction: TransactionJSON,
  ): ConfirmedTransaction {
    return this._convertTransactionBase(transaction, invocation => {
      if (invocation.data == null) {
        throw new Error('Unexpected null data');
      }

      const data = this._convertInvocationData(invocation.data);
      return {
        type: 'InvocationTransaction',
        txid: invocation.txid,
        size: invocation.size,
        version: invocation.version,
        attributes: this._convertAttributes(invocation.attributes),
        vin: invocation.vin,
        vout: this._convertOutputs(invocation.vout),
        scripts: invocation.scripts,
        systemFee: new BigNumber(invocation.sys_fee),
        networkFee: new BigNumber(invocation.net_fee),
        script: invocation.script,
        gas: new BigNumber(invocation.gas),
        data,
      };
    });
  }

  _convertTransactionBase<
    Result: InvocationTransaction | ConfirmedInvocationTransaction,
  >(
    transaction: TransactionJSON,
    convertInvocation: (invocation: InvocationTransactionJSON) => Result,
  ): CommonTransaction | Result {
    switch (transaction.type) {
      case 'ClaimTransaction':
        return {
          type: 'ClaimTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          claims: transaction.claims,
        };
      case 'ContractTransaction':
        return {
          type: 'ContractTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
        };
      case 'EnrollmentTransaction':
        return {
          type: 'EnrollmentTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          publicKey: transaction.pubkey,
        };
      case 'InvocationTransaction':
        return convertInvocation(transaction);
      case 'IssueTransaction':
        return {
          type: 'IssueTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
        };
      case 'MinerTransaction':
        return {
          type: 'MinerTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          nonce: transaction.nonce,
        };
      case 'PublishTransaction':
        return {
          type: 'PublishTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          contract: this._convertContract(transaction.contract),
        };
      case 'RegisterTransaction':
        return {
          type: 'RegisterTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          asset: {
            type: transaction.asset.type,
            name: Array.isArray(transaction.asset.name)
              ? transaction.asset.name[0].name
              : transaction.asset.name,
            amount: new BigNumber(transaction.asset.amount),
            precision: transaction.asset.precision,
            owner: transaction.asset.owner,
            admin: transaction.asset.admin,
          },
        };
      case 'StateTransaction':
        return {
          type: 'StateTransaction',
          txid: transaction.txid,
          size: transaction.size,
          version: transaction.version,
          attributes: this._convertAttributes(transaction.attributes),
          vin: transaction.vin,
          vout: this._convertOutputs(transaction.vout),
          scripts: transaction.scripts,
          systemFee: new BigNumber(transaction.sys_fee),
          networkFee: new BigNumber(transaction.net_fee),
          descriptors: transaction.descriptors,
        };
      /* istanbul ignore next */
      default:
        // eslint-disable-next-line
        (transaction.type: empty);
        throw new Error('For Flow');
    }
  }

  _convertAttributes(attributes: Array<AttributeJSON>): Array<Attribute> {
    return attributes.map(attribute => ({
      usage: (attribute.usage: $FlowFixMe),
      data: attribute.data,
    }));
  }

  _convertOutputs(outputs: Array<OutputJSON>): Array<Output> {
    return outputs.map(output => this._convertOutput(output));
  }

  _convertOutput(output: OutputJSON): Output {
    return {
      asset: output.asset,
      address: output.address,
      value: new BigNumber(output.value),
    };
  }

  _convertContract(contract: ContractJSON): Contract {
    return {
      version: contract.version,
      hash: contract.hash,
      script: contract.script,
      parameters: contract.parameters,
      returnType: contract.returntype,
      name: contract.name,
      codeVersion: contract.code_version,
      author: contract.author,
      email: contract.email,
      description: contract.description,
      properties: {
        storage: contract.properties.storage,
        dynamicInvoke: contract.properties.dynamic_invoke,
      },
    };
  }

  _convertInvocationData(data: InvocationDataJSON): RawInvocationData {
    return {
      result: this._convertInvocationResult(data.result),
      asset: data.asset == null ? data.asset : this._convertAsset(data.asset),
      contracts: data.contracts.map(contract =>
        this._convertContract(contract),
      ),
      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      actions: data.actions.map(action => this._convertAction(action)),
    };
  }

  _convertInvocationResult(result: InvocationResultJSON): RawInvocationResult {
    if (result.state === VM_STATE.FAULT) {
      return {
        state: 'FAULT',
        gasConsumed: new BigNumber(result.gas_consumed),
        stack: this._convertContractParameters(result.stack),
        message: result.message,
      };
    }

    return {
      state: 'HALT',
      gasConsumed: new BigNumber(result.gas_consumed),
      stack: this._convertContractParameters(result.stack),
    };
  }

  _convertContractParameters(
    parameters: Array<ContractParameterJSON>,
  ): Array<ContractParameter> {
    return parameters.map(parameter =>
      this._convertContractParameter(parameter),
    );
  }

  _convertContractParameter(
    parameter: ContractParameterJSON,
  ): ContractParameter {
    if (parameter.type === 'Integer') {
      return {
        type: 'Integer',
        value: new BN(parameter.value, 10),
      };
    }
    if (parameter.type === 'Array') {
      return {
        type: 'Array',
        value: this._convertContractParameters(parameter.value),
      };
    }

    return parameter;
  }

  _convertValidator(validator: ValidatorJSON): Validator {
    return {
      version: validator.version,
      publicKey: validator.publicKey,
      registered: validator.registered,
      votes: new BigNumber(validator.votes),
    };
  }

  _convertAction(action: ActionJSON): ActionRaw {
    if (action.type === 'Log') {
      return action;
    }

    return {
      type: 'Notification',
      version: action.version,
      blockIndex: action.blockIndex,
      blockHash: action.blockHash,
      transactionIndex: action.transactionIndex,
      transactionHash: action.transactionHash,
      index: action.index,
      scriptHash: action.scriptHash,
      args: this._convertContractParameters(action.args),
    };
  }

  _convertAsset(asset: AssetJSON): Asset {
    const assetName = asset.name;
    let name;
    if (Array.isArray(assetName)) {
      const enName = assetName.find(({ lang }) => lang === 'en');
      if (enName == null) {
        // eslint-disable-next-line
        name = assetName[0].name;
      } else {
        // eslint-disable-next-line
        name = enName.name;
      }
    } else {
      name = assetName;
    }
    return {
      hash: asset.id,
      type: asset.type,
      name,
      amount: new BigNumber(asset.amount),
      available: new BigNumber(asset.available),
      precision: asset.precision,
      owner: asset.owner,
      admin: asset.admin,
      issuer: asset.issuer,
      expiration: asset.expiration,
      frozen: asset.frozen,
    };
  }

  _getAccount(address: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this._client.getAccount(address, monitor);
  }

  _convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
    return {
      issueGASFee: new BigNumber(settings.issueGASFee),
    };
  }

  _capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    name: string,
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor == null) {
      return func();
    }

    return monitor.at('neo_one_data_provider').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
