/* @flow */
import {
  type AccountJSON,
  type AssetJSON,
  type BlockJSON,
  type ContractJSON,
  type InputJSON,
  type InvocationDataJSON,
  type InvocationResultJSON,
  type NetworkSettingsJSON,
  type OutputJSON,
  type StorageItemJSON,
  type TransactionJSON,
  type TransactionReceiptJSON,
  type ValidatorJSON,
} from '@neo-one/client-core';
import BigNumber from 'bignumber.js';

import {
  type AddressString,
  type BufferString,
  type GetOptions,
  type Hash160String,
  type Hash256String,
  type Peer,
  type Options,
} from '../../types';
import { type JSONRPCProvider } from './JSONRPCProvider';
import { RelayTransactionError } from '../../errors';

export default class JSONRPCClient {
  _provider: JSONRPCProvider;

  constructor(provider: JSONRPCProvider) {
    this._provider = provider;
  }

  getAccount(hash: AddressString): Promise<AccountJSON> {
    return this._provider.request({
      method: 'getaccountstate',
      params: [hash],
    });
  }

  getAsset(hash: Hash256String): Promise<AssetJSON> {
    return this._provider.request({
      method: 'getassetstate',
      params: [hash],
    });
  }

  getBlock(
    hashOrIndex: Hash256String | number,
    options?: GetOptions,
  ): Promise<BlockJSON> {
    const { timeoutMS } = options || {};
    return this._provider.request({
      method: 'getblock',
      params: [hashOrIndex, 1],
      watchTimeoutMS: timeoutMS,
    });
  }

  getBestBlockHash(): Promise<string> {
    return this._provider.request({ method: 'getbestblockhash' });
  }

  getBlockCount(): Promise<number> {
    return this._provider.request({ method: 'getblockcount' });
  }

  getContract(hash: Hash160String): Promise<ContractJSON> {
    return this._provider.request({
      method: 'getcontractstate',
      params: [hash],
    });
  }

  getMemPool(): Promise<Array<string>> {
    return this._provider.request({ method: 'getrawmempool' });
  }

  getTransaction(hash: Hash256String): Promise<TransactionJSON> {
    return this._provider.request({
      method: 'getrawtransaction',
      params: [hash, 1],
    });
  }

  getStorageItem(
    hash: Hash160String,
    key: BufferString,
  ): Promise<StorageItemJSON> {
    return this._provider
      .request({
        method: 'getstorage',
        params: [hash, key],
      })
      .then(value => ({ hash, key, value }));
  }

  getUnspentOutput(input: InputJSON): Promise<?OutputJSON> {
    return this._provider.request({
      method: 'gettxout',
      params: [input.txid, input.vout],
    });
  }

  testInvokeRaw(script: BufferString): Promise<InvocationResultJSON> {
    return this._provider.request({
      method: 'invokescript',
      params: [script],
    });
  }

  sendTransactionRaw(value: BufferString): Promise<void> {
    return this._provider
      .request({
        method: 'sendrawtransaction',
        params: [value],
      })
      .then(result => {
        if (!result) {
          throw new RelayTransactionError('Relay transaction failed.');
        }

        return result;
      });
  }

  relayTransaction(value: BufferString): Promise<TransactionJSON> {
    return this._provider
      .request({
        method: 'relaytransaction',
        params: [value],
      })
      .catch(error => {
        if (error.code === 'JSON_RPC' && error.responseError.code === -110) {
          throw new RelayTransactionError(error.responseError.message);
        }

        throw error;
      });
  }

  getOutput(input: InputJSON): Promise<OutputJSON> {
    return this._provider.request({
      method: 'getoutput',
      params: [input.txid, input.vout],
    });
  }

  getClaimAmount(input: InputJSON): Promise<BigNumber> {
    return this._provider
      .request({
        method: 'getclaimamount',
        params: [input.txid, input.vout],
      })
      .then(res => new BigNumber(res));
  }

  getAllStorage(hash: Hash160String): Promise<Array<StorageItemJSON>> {
    return this._provider.request({
      method: 'getallstorage',
      params: [hash],
    });
  }

  testInvocation(value: BufferString): Promise<InvocationResultJSON> {
    return this._provider.request({
      method: 'testinvocation',
      params: [value],
    });
  }

  getTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceiptJSON> {
    const { timeoutMS } = options || {};
    return this._provider.request({
      method: 'gettransactionreceipt',
      params: [hash],
      watchTimeoutMS: timeoutMS,
    });
  }

  getInvocationData(hash: Hash256String): Promise<InvocationDataJSON> {
    return this._provider.request({
      method: 'getinvocationdata',
      params: [hash],
    });
  }

  getValidators(): Promise<Array<ValidatorJSON>> {
    return this._provider.request({
      method: 'getvalidators',
    });
  }

  getConnectedPeers(): Promise<Array<Peer>> {
    return this._provider
      .request({
        method: 'getpeers',
      })
      .then(result => result.connected);
  }

  getNetworkSettings(): Promise<NetworkSettingsJSON> {
    return this._provider.request({
      method: 'getnetworksettings',
    });
  }

  runConsensusNow(): Promise<void> {
    return this._provider.request({
      method: 'runconsensusnow',
    });
  }

  updateSettings(options: Options): Promise<void> {
    return this._provider.request({
      method: 'updatesettings',
      params: [options],
    });
  }
}
