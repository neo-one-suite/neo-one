import {
  AccountJSON,
  AddressString,
  addressToScriptHash,
  AssetJSON,
  BlockJSON,
  BufferString,
  CallReceiptJSON,
  ContractJSON,
  GetOptions,
  Hash256String,
  InputJSON,
  InvocationDataJSON,
  InvocationResultJSON,
  NetworkSettingsJSON,
  OutputJSON,
  Peer,
  PrivateNetworkSettings,
  RelayTransactionResultJSON,
  StorageItemJSON,
  TransactionJSON,
  TransactionReceiptJSON,
} from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { RelayTransactionError } from '../errors';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider | JSONRPCProviderManager;

  public constructor(provider: JSONRPCProvider | JSONRPCProviderManager) {
    this.provider = provider;
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<AccountJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getaccountstate',
          params: [address],
        },
        monitor,
      ),
    );
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<AssetJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getassetstate',
          params: [hash],
        },
        monitor,
      ),
    );
  }

  public async getBlock(hashOrIndex: Hash256String | number, options: GetOptions = {}): Promise<BlockJSON> {
    const { timeoutMS, monitor } = options;

    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getblock',
          params: [hashOrIndex, 1],
          watchTimeoutMS: timeoutMS,
        },
        monitor,
      ),
    );
  }

  public async getBestBlockHash(monitor?: Monitor): Promise<string> {
    return this.withInstance(async (provider) => provider.request({ method: 'getbestblockhash' }, monitor));
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.withInstance(async (provider) => provider.request({ method: 'getblockcount' }, monitor));
  }

  public async getContract(address: AddressString, monitor?: Monitor): Promise<ContractJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getcontractstate',
          params: [addressToScriptHash(address)],
        },

        monitor,
      ),
    );
  }

  public async getMemPool(monitor?: Monitor): Promise<readonly string[]> {
    return this.withInstance(async (provider) => provider.request({ method: 'getrawmempool' }, monitor));
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<TransactionJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getrawtransaction',
          params: [hash, 1],
        },
        monitor,
      ),
    );
  }

  public async getUnspentOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON | undefined> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'gettxout',
          params: [input.txid, input.vout],
        },
        monitor,
      ),
    );
  }

  public async testInvokeRaw(script: BufferString, monitor?: Monitor): Promise<InvocationResultJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'invokescript',
          params: [script],
        },
        monitor,
      ),
    );
  }

  public async relayTransaction(value: BufferString, monitor?: Monitor): Promise<RelayTransactionResultJSON> {
    return this.withInstance(async (provider) =>
      provider
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
        }),
    );
  }

  public async getOutput(input: InputJSON, monitor?: Monitor): Promise<OutputJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getoutput',
          params: [input.txid, input.vout],
        },
        monitor,
      ),
    );
  }

  public async getClaimAmount(input: InputJSON, monitor?: Monitor): Promise<BigNumber> {
    return this.withInstance(async (provider) =>
      provider
        .request(
          {
            method: 'getclaimamount',
            params: [input.txid, input.vout],
          },
          monitor,
        )
        .then((res) => new BigNumber(res)),
    );
  }

  public async getAllStorage(address: AddressString, monitor?: Monitor): Promise<readonly StorageItemJSON[]> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getallstorage',
          params: [addressToScriptHash(address)],
        },
        monitor,
      ),
    );
  }

  public async testInvocation(value: BufferString, monitor?: Monitor): Promise<CallReceiptJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'testinvocation',
          params: [value],
        },
        monitor,
      ),
    );
  }

  public async getTransactionReceipt(hash: Hash256String, options: GetOptions = {}): Promise<TransactionReceiptJSON> {
    const { timeoutMS, monitor } = options;

    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'gettransactionreceipt',
          params: [hash],
          watchTimeoutMS: timeoutMS,
        },
        monitor,
      ),
    );
  }

  public async getInvocationData(hash: Hash256String, monitor?: Monitor): Promise<InvocationDataJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getinvocationdata',
          params: [hash],
        },
        monitor,
      ),
    );
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<readonly Peer[]> {
    return this.withInstance(async (provider) =>
      provider
        .request(
          {
            method: 'getpeers',
          },
          monitor,
        )
        .then((result) => result.connected),
    );
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettingsJSON> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getnetworksettings',
        },
        monitor,
      ),
    );
  }

  public async runConsensusNow(monitor?: Monitor): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'runconsensusnow',
        },
        monitor,
      ),
    );
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>, monitor?: Monitor): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'updatesettings',
          params: [options],
        },
        monitor,
      ),
    );
  }

  public async getSettings(monitor?: Monitor): Promise<PrivateNetworkSettings> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'getsettings',
        },
        monitor,
      ),
    );
  }

  public async fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'fastforwardoffset',
          params: [seconds],
        },
        monitor,
      ),
    );
  }

  public async fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request(
        {
          method: 'fastforwardtotime',
          params: [seconds],
        },
        monitor,
      ),
    );
  }

  public async reset(monitor?: Monitor): Promise<void> {
    return this.withInstance(async (provider) => provider.request({ method: 'reset' }, monitor));
  }

  private async withInstance<TResult>(func: (instance: JSONRPCProvider) => Promise<TResult>): Promise<TResult>;
  private async withInstance<TResult>(func: (instance: JSONRPCProvider) => TResult): Promise<TResult> {
    // tslint:disable-next-line no-any
    if (this.provider instanceof JSONRPCProvider) {
      // tslint:disable-next-line no-any
      return func(this.provider as any);
    }

    const instance = await this.provider.getInstance();

    return func(instance);
  }
}
