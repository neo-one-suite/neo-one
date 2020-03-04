import {
  AddressString,
  addressToScriptHash,
  BlockJSON,
  BufferString,
  ConfirmedTransactionJSON,
  ContractJSON,
  ContractParameterJSON,
  GetOptions,
  Hash256String,
  HeaderJSON,
  InvocationResultJSON,
  Peer,
  PluginJSON,
  RelayTransactionResultJSON,
  StorageItemJSON,
  ValidatorJSON,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { RelayTransactionError } from '../errors';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

export class JSONRPCClient {
  private readonly provider: JSONRPCProvider | JSONRPCProviderManager;

  public constructor(provider: JSONRPCProvider | JSONRPCProviderManager) {
    this.provider = provider;
  }

  // Blockchain

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

  public async getBlockHash(index: number): Promise<Hash256String> {
    return this.withInstance(async (provider) => provider.request({ method: 'getblockhash', params: [index] }));
  }

  public async getBlockHeader(hashOrIndex: Hash256String | number, options: GetOptions = {}): Promise<HeaderJSON> {
    const { timeoutMS } = options;

    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getblockheader',
        params: [hashOrIndex, 1],
        watchTimeoutMS: timeoutMS,
      }),
    );
  }
  public async getBlockSysFee(index: number): Promise<BigNumber> {
    return this.withInstance(async (provider) =>
      provider.request({ method: 'getblocksysfee', params: [index] }).then((value) => new BigNumber(value)),
    );
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

  public async getTransaction(hash: Hash256String, options: GetOptions = {}): Promise<ConfirmedTransactionJSON> {
    const { timeoutMS } = options;

    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getrawtransaction',
        params: [hash, 1],
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

  public async getStorage(
    scriptHashOrId: AddressString | number,
    key: BufferString,
  ): Promise<readonly StorageItemJSON[]> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getstorage',
        params: [typeof scriptHashOrId === 'number' ? scriptHashOrId : addressToScriptHash(scriptHashOrId), key],
      }),
    );
  }

  public async getValidators(): Promise<ValidatorJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getvalidators',
      }),
    );
  }

  // Node

  public async getConnectionCount(): Promise<number> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getconnectioncount',
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

  public async getVersion() {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'getversion',
      }),
    );
  }

  public async sendTransaction(value: BufferString, options: GetOptions = {}): Promise<RelayTransactionResultJSON> {
    const { timeoutMS } = options;

    return this.withInstance(async (provider) =>
      provider
        .request({
          method: 'sendrawtransaction',
          params: [value],
          watchTimeoutMS: timeoutMS,
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

  // Smart Contract

  public async invokeFunction(
    contract: AddressString,
    method: string,
    args: readonly ContractParameterJSON[],
  ): Promise<InvocationResultJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'invokefunction',
        params: [addressToScriptHash(contract), method, args],
      }),
    );
  }

  public async invokeScript(script: BufferString): Promise<InvocationResultJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'invokescript',
        params: [script],
      }),
    );
  }

  // Utilities

  public async listPlugins(): Promise<PluginJSON> {
    return this.withInstance(async (provider) =>
      provider.request({
        method: 'listplugins',
      }),
    );
  }

  // Dev

  // public async getNetworkSettings(): Promise<NetworkSettingsJSON> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'getnetworksettings',
  //     }),
  //   );
  // }

  // public async runConsensusNow(): Promise<void> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'runconsensusnow',
  //     }),
  //   );
  // }

  // public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'updatesettings',
  //       params: [options],
  //     }),
  //   );
  // }

  // public async getSettings(): Promise<PrivateNetworkSettings> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'getsettings',
  //     }),
  //   );
  // }

  // public async fastForwardOffset(seconds: number): Promise<void> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'fastforwardoffset',
  //       params: [seconds],
  //     }),
  //   );
  // }

  // public async fastForwardToTime(seconds: number): Promise<void> {
  //   return this.withInstance(async (provider) =>
  //     provider.request({
  //       method: 'fastforwardtotime',
  //       params: [seconds],
  //     }),
  //   );
  // }

  // public async reset(): Promise<void> {
  //   return this.withInstance(async (provider) => provider.request({ method: 'reset' }));
  // }

  // public async getNEOTrackerURL(): Promise<string | undefined> {
  //   return this.withInstance(async (provider) => provider.request({ method: 'getneotrackerurl' }));
  // }

  // public async resetProject(): Promise<void> {
  //   return this.withInstance(async (provider) => provider.request({ method: 'resetproject' }));
  // }

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
