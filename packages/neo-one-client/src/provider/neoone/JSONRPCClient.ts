import {
  AccountJSON,
  AssetJSON,
  BlockJSON,
  ContractJSON,
  InputJSON,
  InvocationDataJSON,
  InvocationResultJSON,
  NetworkSettingsJSON,
  OutputJSON,
  StorageItemJSON,
  TransactionJSON,
  TransactionReceiptJSON,
  ValidatorJSON,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { RelayTransactionError } from '../../errors';
import {
  AddressString,
  BufferString,
  GetOptions,
  Hash160String,
  Hash256String,
  Options,
  Peer,
} from '../../types';
import { JSONRPCProvider } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider;

  constructor(provider: JSONRPCProvider) {
    this.provider = provider;
  }

  public getAccount(
    hash: AddressString,
    monitor?: Monitor,
  ): Promise<AccountJSON> {
    return this.provider.request(
      {
        method: 'getaccountstate',
        params: [hash],
      },

      monitor,
    );
  }

  public getAsset(hash: Hash256String, monitor?: Monitor): Promise<AssetJSON> {
    return this.provider.request(
      {
        method: 'getassetstate',
        params: [hash],
      },

      monitor,
    );
  }

  public getBlock(
    hashOrIndex: Hash256String | number,
    options: GetOptions = {},
  ): Promise<BlockJSON> {
    const { timeoutMS, monitor } = options;
    return this.provider.request(
      {
        method: 'getblock',
        params: [hashOrIndex, 1],
        watchTimeoutMS: timeoutMS,
      },

      monitor,
    );
  }

  public getBestBlockHash(monitor?: Monitor): Promise<string> {
    return this.provider.request({ method: 'getbestblockhash' }, monitor);
  }

  public getBlockCount(monitor?: Monitor): Promise<number> {
    return this.provider.request({ method: 'getblockcount' }, monitor);
  }

  public getContract(
    hash: Hash160String,
    monitor?: Monitor,
  ): Promise<ContractJSON> {
    return this.provider.request(
      {
        method: 'getcontractstate',
        params: [hash],
      },

      monitor,
    );
  }

  public getMemPool(monitor?: Monitor): Promise<string[]> {
    return this.provider.request({ method: 'getrawmempool' }, monitor);
  }

  public getTransaction(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<TransactionJSON> {
    return this.provider.request(
      {
        method: 'getrawtransaction',
        params: [hash, 1],
      },
      monitor,
    );
  }

  public getStorageItem(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItemJSON> {
    return this.provider
      .request(
        {
          method: 'getstorage',
          params: [hash, key],
        },
        monitor,
      )
      .then((value) => ({ hash, key, value }));
  }

  public getUnspentOutput(
    input: InputJSON,
    monitor?: Monitor,
  ): Promise<OutputJSON | null> {
    return this.provider.request(
      {
        method: 'gettxout',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  public testInvokeRaw(
    script: BufferString,
    monitor?: Monitor,
  ): Promise<InvocationResultJSON> {
    return this.provider.request(
      {
        method: 'invokescript',
        params: [script],
      },
      monitor,
    );
  }

  public sendTransactionRaw(
    value: BufferString,
    monitor?: Monitor,
  ): Promise<void> {
    return this.provider
      .request(
        {
          method: 'sendrawtransaction',
          params: [value],
        },
        monitor,
      )
      .then((result) => {
        if (!result) {
          throw new RelayTransactionError('Relay transaction failed.');
        }

        return result;
      });
  }

  public relayTransaction(
    value: BufferString,
    monitor?: Monitor,
  ): Promise<TransactionJSON> {
    return this.provider
      .request(
        {
          method: 'relaytransaction',
          params: [value],
        },
        monitor,
      )
      .catch((error: any) => {
        if (error.code === 'JSON_RPC' && error.responseError.code === -110) {
          throw new RelayTransactionError(error.responseError.message);
        }

        throw error;
      });
  }

  public getOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON> {
    return this.provider.request(
      {
        method: 'getoutput',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  public getClaimAmount(
    input: InputJSON,
    monitor?: Monitor,
  ): Promise<BigNumber> {
    return this.provider
      .request(
        {
          method: 'getclaimamount',
          params: [input.txid, input.vout],
        },
        monitor,
      )
      .then((res) => new BigNumber(res));
  }

  public getAllStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): Promise<StorageItemJSON[]> {
    return this.provider.request(
      {
        method: 'getallstorage',
        params: [hash],
      },
      monitor,
    );
  }

  public testInvocation(
    value: BufferString,
    monitor?: Monitor,
  ): Promise<InvocationResultJSON> {
    return this.provider.request(
      {
        method: 'testinvocation',
        params: [value],
      },
      monitor,
    );
  }

  public getTransactionReceipt(
    hash: Hash256String,
    options: GetOptions = {},
  ): Promise<TransactionReceiptJSON> {
    const { timeoutMS, monitor } = options;
    return this.provider.request(
      {
        method: 'gettransactionreceipt',
        params: [hash],
        watchTimeoutMS: timeoutMS,
      },
      monitor,
    );
  }

  public getInvocationData(
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<InvocationDataJSON> {
    return this.provider.request(
      {
        method: 'getinvocationdata',
        params: [hash],
      },
      monitor,
    );
  }

  public getValidators(monitor?: Monitor): Promise<ValidatorJSON[]> {
    return this.provider.request(
      {
        method: 'getvalidators',
      },
      monitor,
    );
  }

  public getConnectedPeers(monitor?: Monitor): Promise<Peer[]> {
    return this.provider
      .request(
        {
          method: 'getpeers',
        },
        monitor,
      )
      .then((result) => result.connected);
  }

  public getNetworkSettings(monitor?: Monitor): Promise<NetworkSettingsJSON> {
    return this.provider.request(
      {
        method: 'getnetworksettings',
      },
      monitor,
    );
  }

  public runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'runconsensusnow',
      },
      monitor,
    );
  }

  public updateSettings(options: Options, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'updatesettings',
        params: [options],
      },
      monitor,
    );
  }

  public fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'fastforwardoffset',
        params: [seconds],
      },
      monitor,
    );
  }

  public fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'fastforwardtotime',
        params: [seconds],
      },
      monitor,
    );
  }

  public reset(monitor?: Monitor): Promise<void> {
    return this.provider.request({ method: 'reset' }, monitor);
  }
}
