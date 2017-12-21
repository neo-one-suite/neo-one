/* @flow */
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
  type TransactionJSON,
  JSONHelper,
  common,
  crypto,
  utils,
} from '@neo-one/core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';

import _ from 'lodash';
import { flatten, flatMap, map } from 'ix/asynciterable/pipe/index';

import type {
  Account,
  Action,
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
  GetOptions,
  Hash160String,
  Hash256String,
  Input,
  InvocationTransaction,
  RawInvocationData,
  RawInvocationResult,
  Network,
  Output,
  StorageItem,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
  Validator,
} from '../../types'; // eslint-disable-line
import AsyncBlockIterator from '../../AsyncBlockIterator';
import JSONRPCClient from './JSONRPCClient';
import JSONRPCHTTPProvider from './JSONRPCHTTPProvider';

export type NEOONEDataProviderOptions = {|
  network: Network,
  rpcURL: string,
  iterBlocksFetchTimeoutMS?: number,
|};

export default class NEOONEDataProvider implements DataProvider {
  network: Network;

  _client: JSONRPCClient;
  _iterBlocksFetchTimeoutMS: ?number;

  constructor({
    network,
    rpcURL,
    iterBlocksFetchTimeoutMS,
  }: NEOONEDataProviderOptions) {
    this.network = network;
    this._client = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
    this._iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
  }

  async getUnclaimed(
    address: AddressString,
  ): Promise<{| unclaimed: Array<Input>, amount: BigNumber |}> {
    const account = await this._getAccount(address);
    const amounts = await Promise.all(
      account.unclaimed.map(input => this._client.getClaimAmount(input)),
    );

    return {
      unclaimed: account.unclaimed,
      amount: amounts.reduce(
        (acc, amount) => acc.plus(amount),
        utils.ZERO_BIG_NUMBER,
      ),
    };
  }

  async getUnspentOutputs(
    address: AddressString,
  ): Promise<Array<UnspentOutput>> {
    const account = await this._getAccount(address);
    const outputs = await Promise.all(
      account.unspent.map(async (input): Promise<?UnspentOutput> => {
        const outputJSON = await this._client.getUnspentOutput(input);
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
  }

  async relayTransaction(transaction: string): Promise<Transaction> {
    const result = await this._client.relayTransaction(transaction);
    return this._convertTransaction(result);
  }

  getTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this._client.getTransactionReceipt(hash, options);
  }

  async getInvocationData(hash: Hash256String): Promise<RawInvocationData> {
    const result = await this._client.getInvocationData(hash);
    return this._convertInvocationData(result);
  }

  async testInvoke(transaction: string): Promise<RawInvocationResult> {
    const result = await this._client.testInvocation(transaction);
    return this._convertInvocationResult(result);
  }

  async getAccount(address: AddressString): Promise<Account> {
    const account = await this._getAccount(address);
    return {
      address: this._scriptHashToAddress(account.script_hash),
      frozen: account.frozen,
      votes: account.votes,
      balances: account.balances.reduce((acc, { asset, value }) => {
        acc[asset] = new BigNumber(value);
        return acc;
      }, {}),
    };
  }

  async getAsset(hash: Hash256String): Promise<Asset> {
    const asset = await this._client.getAsset(hash);
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
        fetchTimeoutMS:
          this._iterBlocksFetchTimeoutMS == null
            ? undefined
            : this._iterBlocksFetchTimeoutMS,
      }),
    ).pipe(map(block => this._convertBlock(block)));
  }

  getBestBlockHash(): Promise<Hash256String> {
    return this._client.getBestBlockHash();
  }

  getBlockCount(): Promise<number> {
    return this._client.getBlockCount();
  }

  async getContract(hash: Hash160String): Promise<Contract> {
    const contract = await this._client.getContract(hash);
    return this._convertContract(contract);
  }

  getMemPool(): Promise<Array<Hash256String>> {
    return this._client.getMemPool();
  }

  async getTransaction(hash: Hash256String): Promise<Transaction> {
    const transaction = await this._client.getTransaction(hash);
    return this._convertTransaction(transaction);
  }

  getValidators(): Promise<Array<Validator>> {
    return this._client.getValidators();
  }

  _getStorage(hash: Hash160String, key: BufferString): Promise<StorageItem> {
    return this._client.getStorageItem(hash, key);
  }

  _iterStorage(hash: Hash160String): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this._client.getAllStorage(hash).then(res => AsyncIterableX.from(res)),
    ).pipe(flatten());
  }

  _iterActions(filterIn?: BlockFilter): AsyncIterable<Action> {
    const filter = filterIn || {};
    return AsyncIterableX.from(
      this.iterBlocks({
        indexStart: filter.indexStart,
        indexStop: filter.indexStop,
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

  _convertBlock(block: BlockJSON): Block {
    return {
      version: block.version,
      hash: block.hash,
      previousBlockHash: block.previousblockhash,
      merkleroot: block.merkleroot,
      time: block.time,
      index: block.index,
      nonce: block.nonce,
      nextConsensus: this._scriptHashToAddress(block.nextconsensus),
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
            admin: crypto.scriptHashToAddress({
              addressVersion: this.network.addressVersion,
              scriptHash: common.stringToUInt160(transaction.asset.admin),
            }),
          },
        };
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
      address: crypto.scriptHashToAddress({
        addressVersion: this.network.addressVersion,
        scriptHash: common.stringToUInt160(output.address),
      }),
      value: new BigNumber(output.value),
    };
  }

  _convertContract(contract: ContractJSON): Contract {
    return {
      version: contract.version,
      hash: contract.hash,
      script: contract.script,
      parameters: contract.parameters,
      returntype: contract.returntype,
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
      voteUpdates: data.voteUpdates.map(([scriptHash, votes]) => [
        this._scriptHashToAddress(scriptHash),
        votes,
      ]),
      validators: data.validators,
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
        value: JSONHelper.readFixed8(parameter.value),
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

  _convertAction(action: ActionJSON): Action {
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
      // eslint-disable-next-line
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

  _getAccount(address: AddressString): Promise<AccountJSON> {
    return this._client.getAccount(address);
  }

  _scriptHashToAddress(scriptHash: string): AddressString {
    return crypto.scriptHashToAddress({
      addressVersion: this.network.addressVersion,
      scriptHash: JSONHelper.readUInt160(scriptHash),
    });
  }

  _addressToScriptHash(address: AddressString): string {
    return JSONHelper.writeUInt160(
      crypto.addressToScriptHash({
        addressVersion: this.network.addressVersion,
        address,
      }),
    );
  }
}
