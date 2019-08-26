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
import BigNumber from 'bignumber.js';
import { RelayTransactionError } from '../errors';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider | JSONRPCProviderManager;

  public constructor(provider: JSONRPCProvider | JSONRPCProviderManager) {
    this.provider = provider;
  }

  public async getAccount(address: AddressString): Promise<AccountJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getaccountstate',
        params: [address],
      }),
    );
  }

  public async getAsset(hash: Hash256String): Promise<AssetJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getassetstate',
        params: [hash],
      }),
    );
  }

  public async getBlock(hashOrIndex: Hash256String | number, options: GetOptions = {}): Promise<BlockJSON> {
    const { timeoutMS } = options;

    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getblock',
        params: [hashOrIndex, 1],
        watchTimeoutMS: timeoutMS,
      }),
    );
  }

  public async getBestBlockHash(): Promise<string> {
    return this.withInstance(async (provider) => provider.request({ method: 'getbestblockhash' }));
  }

  public async getBlockCount(): Promise<number> {
    return this.withInstance(async (provider) => provider.request({ method: 'getblockcount' }));
  }

  public async getContract(address: AddressString): Promise<ContractJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getcontractstate',
        params: [addressToScriptHash(address)],
      }),
    );
  }

  public async getMemPool(): Promise<readonly string[]> {
    return this.withInstance(async (provider) => provider.request({ method: 'getrawmempool' }));
  }

  public async getTransaction(hash: Hash256String): Promise<TransactionJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getrawtransaction',
        params: [hash, 1],
      }),
    );
  }

  public async getUnspentOutput(input: InputJSON): Promise<OutputJSON | undefined> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'gettxout',
        params: [input.txid, input.vout],
      }),
    );
  }

  public async testInvokeRaw(script: BufferString): Promise<InvocationResultJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'invokescript',
        params: [script],
      }),
    );
  }

  public async relayTransaction(value: BufferString): Promise<RelayTransactionResultJSON> {
    return this.withInstance(async (provider) =>
      provider
        .request({
          method: 'relaytransaction',
          params: [value],
        })
        .catch((error) => {
          const [message, code]: [string, string] = error.message.split(':');
          if (error.code === 'JSON_RPC' && code === '-110') {
            throw new RelayTransactionError(message);
          }

          throw error;
        }),
    );
  }

  public async getOutput(input: InputJSON): Promise<OutputJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getoutput',
        params: [input.txid, input.vout],
      }),
    );
  }

  public async getClaimAmount(input: InputJSON): Promise<BigNumber> {
    return this.withInstance(async (provider) =>
      provider
        .request({
          method: 'getclaimamount',
          params: [input.txid, input.vout],
        })
        .then((res) => new BigNumber(res)),
    );
  }

  public async getAllStorage(address: AddressString): Promise<readonly StorageItemJSON[]> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getallstorage',
        params: [addressToScriptHash(address)],
      }),
    );
  }

  public async testInvocation(value: BufferString): Promise<CallReceiptJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'testinvocation',
        params: [value],
      }),
    );
  }

  public async getTransactionReceipt(hash: Hash256String, options: GetOptions = {}): Promise<TransactionReceiptJSON> {
    const { timeoutMS } = options;

    return this.withInstance(async (provider) =>
      provider.request({
        method: 'gettransactionreceipt',
        params: [hash],
        watchTimeoutMS: timeoutMS,
      }),
    );
  }

  public async getInvocationData(hash: Hash256String): Promise<InvocationDataJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getinvocationdata',
        params: [hash],
      }),
    );
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.withInstance(async (provider) =>
      provider
        .request({
          method: 'getpeers',
        })
        .then((result) => result.connected),
    );
  }

  public async getNetworkSettings(): Promise<NetworkSettingsJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getnetworksettings',
      }),
    );
  }

  public async runConsensusNow(): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'runconsensusnow',
      }),
    );
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'updatesettings',
        params: [options],
      }),
    );
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getsettings',
      }),
    );
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'fastforwardoffset',
        params: [seconds],
      }),
    );
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'fastforwardtotime',
        params: [seconds],
      }),
    );
  }

  public async reset(): Promise<void> {
    return this.withInstance(async (provider) => provider.request({ method: 'reset' }));
  }

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return this.withInstance(async (provider) => provider.request({ method: 'getneotrackerurl' }));
  }

  public async resetProject(): Promise<void> {
    return this.withInstance(async (provider) => provider.request({ method: 'resetproject' }));
  }

  private async withInstance<TResult>(func: (instance: JSONRPCProvider) => Promise<TResult>): Promise<TResult>;
  private async withInstance<TResult>(func: (instance: JSONRPCProvider) => TResult): Promise<TResult> {
    if (this.provider instanceof JSONRPCProvider) {
      // tslint:disable-next-line no-any
      return func(this.provider as any);
    }

    const instance = await this.provider.getInstance();

    return func(instance);
  }
}
