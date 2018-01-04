/* @flow */
import {
  type Input,
  type UInt256,
  type UInt160,
  JSONHelper,
} from '@neo-one/client-core';

import {
  type Asset,
  type BasicClientBaseProvider,
  type Contract,
  type InvocationResult,
  type Output,
  type StorageItem,
} from '../types';
import { type JSONRPCProvider } from './JSONRPCProvider';
import { SendTransactionError } from '../errors';

export default class JSONRPCBasicClientBaseProvider<
  TBlock,
  TTransaction,
  TAccount,
  TInvocationResult: InvocationResult,
>
  implements BasicClientBaseProvider<
      TBlock,
      TTransaction,
      TAccount,
      TInvocationResult,
    > {
  _provider: JSONRPCProvider;

  constructor(provider: JSONRPCProvider) {
    this._provider = provider;
  }

  getAccount(address: string): Promise<TAccount> {
    return this._provider.request({
      method: 'getaccountstate',
      params: [address],
    });
  }

  getAsset(hash: UInt256): Promise<Asset> {
    return this._provider.request({
      method: 'getassetstate',
      params: [JSONHelper.writeUInt256(hash)],
    });
  }

  getBlock(hashOrIndex: UInt256 | number): Promise<TBlock> {
    return this._provider.request({
      method: 'getblock',
      params: [
        typeof hashOrIndex === 'number'
          ? hashOrIndex
          : JSONHelper.writeUInt256(hashOrIndex),
        1,
      ],
    });
  }

  getBestBlockHash(): Promise<string> {
    return this._provider.request({ method: 'getbestblockhash' });
  }

  getBlockCount(): Promise<number> {
    return this._provider.request({ method: 'getblockcount' });
  }

  getContract(hash: UInt160): Promise<Contract> {
    return this._provider.request({
      method: 'getcontractstate',
      params: [JSONHelper.writeUInt160(hash)],
    });
  }

  getMemPool(): Promise<Array<string>> {
    return this._provider.request({ method: 'getrawmempool' });
  }

  getTransaction(hash: UInt256): Promise<TTransaction> {
    return this._provider.request({
      method: 'getrawtransaction',
      params: [JSONHelper.writeUInt256(hash)],
    });
  }

  getStorage(hash: UInt160, key: Buffer): Promise<StorageItem> {
    return this._provider.request({
      method: 'getstorage',
      params: [JSONHelper.writeUInt160(hash), JSONHelper.writeBuffer(key)],
    });
  }

  getUnspentOutput(input: Input): Promise<?Output> {
    return this._provider.request({
      method: 'gettxout',
      params: [JSONHelper.writeUInt256(input.hash), input.index],
    });
  }

  testInvokeRaw(script: Buffer): Promise<TInvocationResult> {
    return this._provider.request({
      method: 'invokescript',
      params: [JSONHelper.writeBuffer(script)],
    });
  }

  sendTransactionRaw(value: Buffer): Promise<void> {
    return this._provider
      .request({
        method: 'sendrawtransaction',
        params: [JSONHelper.writeBuffer(value)],
      })
      .then(result => {
        if (!result) {
          throw new SendTransactionError();
        }

        return result;
      });
  }
}
