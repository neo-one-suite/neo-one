import {
  AddressString,
  addressToScriptHash,
  ApplicationLogJSON,
  BlockJSON,
  BufferString,
  ContractJSON,
  GetOptions,
  Hash256String,
  HeaderJSON,
  InvocationDataJSON,
  Nep5BalancesJSON,
  Nep5TransfersJSON,
  NetworkSettingsJSON,
  Peer,
  PrivateNetworkSettings,
  RawInvocationResultJSON,
  RelayTransactionResultJSON,
  StorageItemJSON,
  TransactionReceiptJSON,
  UnclaimedGASJSON,
  ValidatorJSON,
  VerboseTransactionJSON,
  VersionJSON,
} from '@neo-one/client-common';
import { RelayTransactionError } from '../errors';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider | JSONRPCProviderManager;

  public constructor(provider: JSONRPCProvider | JSONRPCProviderManager) {
    this.provider = provider;
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

  public async getNep5Balances(address: AddressString): Promise<Nep5BalancesJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getnep5balances',
        params: [addressToScriptHash(address)],
      }),
    );
  }

  public async getNep5Transfers(
    address: AddressString,
    startTime?: number,
    endTime?: number,
  ): Promise<Nep5TransfersJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getnep5transfers',
        params: [addressToScriptHash(address), startTime, endTime],
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

  public async getMemPool(): Promise<{ readonly height: number; readonly verified: readonly string[] }> {
    return this.withInstance(async (provider) => provider.request({ method: 'getrawmempool' }));
  }

  public async getTransaction(hash: Hash256String): Promise<VerboseTransactionJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getrawtransaction',
        params: [hash, 1],
      }),
    );
  }

  public async testInvokeRaw(
    script: BufferString,
    verifications: readonly BufferString[] = [],
  ): Promise<RawInvocationResultJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'invokescript',
        params: [script, ...verifications],
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

  public async sendRawTransaction(value: BufferString): Promise<boolean> {
    return this.withInstance(async (provider) =>
      provider
        .request({
          method: 'sendrawtransaction',
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

  public async getUnclaimedGas(address: AddressString): Promise<UnclaimedGASJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getunclaimedgas',
        params: [address],
      }),
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

  public async getTransactionHeight(hash: Hash256String): Promise<number> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'gettransactionheight',
        params: [hash],
      }),
    );
  }

  public async getBlockHash(index: number): Promise<string> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getblockhash',
        params: [index],
      }),
    );
  }

  public async getBlockHeader(hashOrIndex: Hash256String | number): Promise<HeaderJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getblockheader',
        params: [hashOrIndex, 1],
      }),
    );
  }

  public async getValidators(): Promise<readonly ValidatorJSON[]> {
    return this.withInstance(async (provider) => provider.request({ method: 'getvalidators' }));
  }

  public async validateAddress(address: string): Promise<{ readonly address: string; readonly isvalid: boolean }> {
    return this.withInstance(async (provider) => provider.request({ method: 'validateaddress', params: [address] }));
  }

  public async getConnectionCount(): Promise<number> {
    return this.withInstance(async (provider) => provider.request({ method: 'getconnectioncount' }));
  }

  public async getStorage(address: AddressString, key: BufferString): Promise<StorageItemJSON> {
    return this.withInstance(async (provider) => provider.request({ method: 'getstorage', params: [address, key] }));
  }

  public async getVersion(): Promise<VersionJSON> {
    return this.withInstance(async (provider) => provider.request({ method: 'getversion' }));
  }

  public async getApplicationLog(hash: Hash256String): Promise<ApplicationLogJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getapplicationlog',
        params: [hash],
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
