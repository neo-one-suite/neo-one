import {
  AccountJSON,
  AssetJSON,
  BlockJSON,
  CallReceiptJSON,
  ContractJSON,
  InputJSON,
  InvocationDataJSON,
  InvocationResultJSON,
  NetworkSettingsJSON,
  OutputJSON,
  StorageItemJSON,
  TransactionJSON,
  TransactionReceiptJSON,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { RelayTransactionError } from '../../errors';
import { addressToScriptHash } from '../../helpers';
import { AddressString, BufferString, GetOptions, Hash256String, Peer, PrivateNetworkSettings } from '../../types';
import { JSONRPCProvider } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider;

  public constructor(provider: JSONRPCProvider) {
    this.provider = provider;
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this.provider.request(
      {
        method: 'getaccountstate',
        params: [address],
      },
      monitor,
    );
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<AssetJSON> {
    return this.provider.request(
      {
        method: 'getassetstate',
        params: [hash],
      },
      monitor,
    );
  }

  public async getBlock(hashOrIndex: Hash256String | number, options: GetOptions = {}): Promise<BlockJSON> {
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

  public async getBestBlockHash(monitor?: Monitor): Promise<string> {
    return this.provider.request({ method: 'getbestblockhash' }, monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.provider.request({ method: 'getblockcount' }, monitor);
  }

  public async getContract(address: AddressString, monitor?: Monitor): Promise<ContractJSON> {
    return this.provider.request(
      {
        method: 'getcontractstate',
        params: [addressToScriptHash(address)],
      },

      monitor,
    );
  }

  public async getMemPool(monitor?: Monitor): Promise<ReadonlyArray<string>> {
    return this.provider.request({ method: 'getrawmempool' }, monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<TransactionJSON> {
    return this.provider.request(
      {
        method: 'getrawtransaction',
        params: [hash, 1],
      },
      monitor,
    );
  }

  public async getStorageItem(address: AddressString, key: BufferString, monitor?: Monitor): Promise<StorageItemJSON> {
    const hash = addressToScriptHash(address);

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

  public async getUnspentOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON | undefined> {
    return this.provider.request(
      {
        method: 'gettxout',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  public async testInvokeRaw(script: BufferString, monitor?: Monitor): Promise<InvocationResultJSON> {
    return this.provider.request(
      {
        method: 'invokescript',
        params: [script],
      },
      monitor,
    );
  }

  public async relayTransaction(value: BufferString, monitor?: Monitor): Promise<TransactionJSON> {
    return this.provider
      .request(
        {
          method: 'relaytransaction',
          params: [value],
        },
        monitor,
      )
      .catch((error) => {
        const [message, code]: [string, string] = error.message.split(':');
        if (error.code === 'JSON_RPC' && code === '-110') {
          throw new RelayTransactionError(message);
        }

        throw error;
      });
  }

  public async getOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON> {
    return this.provider.request(
      {
        method: 'getoutput',
        params: [input.txid, input.vout],
      },
      monitor,
    );
  }

  public async getClaimAmount(input: InputJSON, monitor?: Monitor): Promise<BigNumber> {
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

  public async getAllStorage(address: AddressString, monitor?: Monitor): Promise<ReadonlyArray<StorageItemJSON>> {
    return this.provider.request(
      {
        method: 'getallstorage',
        params: [addressToScriptHash(address)],
      },
      monitor,
    );
  }

  public async testInvocation(value: BufferString, monitor?: Monitor): Promise<CallReceiptJSON> {
    return this.provider.request(
      {
        method: 'testinvocation',
        params: [value],
      },
      monitor,
    );
  }

  public async getTransactionReceipt(hash: Hash256String, options: GetOptions = {}): Promise<TransactionReceiptJSON> {
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

  public async getInvocationData(hash: Hash256String, monitor?: Monitor): Promise<InvocationDataJSON> {
    return this.provider.request(
      {
        method: 'getinvocationdata',
        params: [hash],
      },
      monitor,
    );
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    return this.provider
      .request(
        {
          method: 'getpeers',
        },
        monitor,
      )
      .then((result) => result.connected);
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettingsJSON> {
    return this.provider.request(
      {
        method: 'getnetworksettings',
      },
      monitor,
    );
  }

  public async runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'runconsensusnow',
      },
      monitor,
    );
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'updatesettings',
        params: [options],
      },
      monitor,
    );
  }

  public async getSettings(monitor?: Monitor): Promise<PrivateNetworkSettings> {
    return this.provider.request(
      {
        method: 'getsettings',
      },
      monitor,
    );
  }

  public async fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'fastforwardoffset',
        params: [seconds],
      },
      monitor,
    );
  }

  public async fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this.provider.request(
      {
        method: 'fastforwardtotime',
        params: [seconds],
      },
      monitor,
    );
  }

  public async reset(monitor?: Monitor): Promise<void> {
    return this.provider.request({ method: 'reset' }, monitor);
  }
}
