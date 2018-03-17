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
import type { Monitor } from '@neo-one/monitor';

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

  getAccount(hash: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this._provider.request(
      {
        method: 'getaccountstate',
        params: [hash],
      },
      monitor,
    );
  }

  getAsset(hash: Hash256String, monitor?: Monitor): Promise<AssetJSON> {
    return this._provider.request(
      {
        method: 'getassetstate',
        params: [hash],
      },
      monitor,
    );
  }

  getBlock(
    hashOrIndex: Hash256String | number,
    options?: GetOptions,
  ): Promise<BlockJSON> {
    const { timeoutMS, monitor } = options || {};
    return this._provider.request(
      {
        method: 'getblock',
        params: [hashOrIndex, 1],
        watchTimeoutMS: timeoutMS,
      },
      monitor,
    );
  }

  getBestBlockHash(monitor?: Monitor): Promise<string> {
    return this._provider.request({ method: 'getbestblockhash' }, monitor);
  }

  getBlockCount(monitor?: Monitor): Promise<number> {
    return this._provider.request({ method: 'getblockcount' }, monitor);
  }

  getContract(hash: Hash160String, monitor?: Monitor): Promise<ContractJSON> {
    return this._provider.request(
      {
        method: 'getcontractstate',
        params: [hash],
      },
      monitor,
    );
  }

  getMemPool(monitor?: Monitor): Promise<Array<string>> {
    return this._provider.request({ method: 'getrawmempool' }, monitor);
  }

  getTransaction(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<TransactionJSON> {
    return this._provider.request(
      {
        method: 'getrawtransaction',
        params: [hash, 1],
      },
      monitor,
    );
  }

  getStorageItem(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItemJSON> {
    return this._provider
      .request(
        {
          method: 'getstorage',
          params: [hash, key],
        },
        monitor,
      )
      .then(value => ({ hash, key, value }));
  }

  getUnspentOutput(input: InputJSON, monitor?: Monitor): Promise<?OutputJSON> {
    return this._provider.request(
      {
        method: 'gettxout',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  testInvokeRaw(
    script: BufferString,
    monitor?: Monitor,
  ): Promise<InvocationResultJSON> {
    return this._provider.request(
      {
        method: 'invokescript',
        params: [script],
      },
      monitor,
    );
  }

  sendTransactionRaw(value: BufferString, monitor?: Monitor): Promise<void> {
    return this._provider
      .request(
        {
          method: 'sendrawtransaction',
          params: [value],
        },
        monitor,
      )
      .then(result => {
        if (!result) {
          throw new RelayTransactionError('Relay transaction failed.');
        }

        return result;
      });
  }

  relayTransaction(
    value: BufferString,
    monitor?: Monitor,
  ): Promise<TransactionJSON> {
    return this._provider
      .request(
        {
          method: 'relaytransaction',
          params: [value],
        },
        monitor,
      )
      .catch(error => {
        if (error.code === 'JSON_RPC' && error.responseError.code === -110) {
          throw new RelayTransactionError(error.responseError.message);
        }

        throw error;
      });
  }

  getOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON> {
    return this._provider.request(
      {
        method: 'getoutput',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  getClaimAmount(input: InputJSON, monitor?: Monitor): Promise<BigNumber> {
    return this._provider
      .request(
        {
          method: 'getclaimamount',
          params: [input.txid, input.vout],
        },
        monitor,
      )
      .then(res => new BigNumber(res));
  }

  getAllStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): Promise<Array<StorageItemJSON>> {
    return this._provider.request(
      {
        method: 'getallstorage',
        params: [hash],
      },
      monitor,
    );
  }

  testInvocation(
    value: BufferString,
    monitor?: Monitor,
  ): Promise<InvocationResultJSON> {
    return this._provider.request(
      {
        method: 'testinvocation',
        params: [value],
      },
      monitor,
    );
  }

  getTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceiptJSON> {
    const { timeoutMS, monitor } = options || {};
    return this._provider.request(
      {
        method: 'gettransactionreceipt',
        params: [hash],
        watchTimeoutMS: timeoutMS,
      },
      monitor,
    );
  }

  getInvocationData(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<InvocationDataJSON> {
    return this._provider.request(
      {
        method: 'getinvocationdata',
        params: [hash],
      },
      monitor,
    );
  }

  getValidators(monitor?: Monitor): Promise<Array<ValidatorJSON>> {
    return this._provider.request(
      {
        method: 'getvalidators',
      },
      monitor,
    );
  }

  getConnectedPeers(monitor?: Monitor): Promise<Array<Peer>> {
    return this._provider
      .request(
        {
          method: 'getpeers',
        },
        monitor,
      )
      .then(result => result.connected);
  }

  getNetworkSettings(monitor?: Monitor): Promise<NetworkSettingsJSON> {
    return this._provider.request(
      {
        method: 'getnetworksettings',
      },
      monitor,
    );
  }

  runConsensusNow(monitor?: Monitor): Promise<void> {
    return this._provider.request(
      {
        method: 'runconsensusnow',
      },
      monitor,
    );
  }

  updateSettings(options: Options, monitor?: Monitor): Promise<void> {
    return this._provider.request(
      {
        method: 'updatesettings',
        params: [options],
      },
      monitor,
    );
  }

  fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this._provider.request(
      {
        method: 'fastforwardoffset',
        params: [seconds],
      },
      monitor,
    );
  }

  fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this._provider.request(
      {
        method: 'fastforwardtotime',
        params: [seconds],
      },
      monitor,
    );
  }
}
