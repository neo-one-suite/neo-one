import {
  ContractManifest,
  NetworkType,
  Param,
  SourceMaps,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client-common';
import { args as clientArgs, Client as ClientLite } from '@neo-one/client-core';
import * as args from './args';
import { ReadClient } from './ReadClient';
import { ContractRegister, PublishReceipt, UserAccountProvider, UserAccountProviders } from './types';

// tslint:disable-next-line no-any
export class Client<TUserAccountProviders extends UserAccountProviders = any> extends ClientLite<
  UserAccountProvider,
  TUserAccountProviders
> {
  public async publish(
    contract: ContractRegister,
    optionsIn?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    const options = clientArgs.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).publish(args.assertContractRegister('contract', contract), options),
    );
  }

  public async publishAndDeploy(
    contract: ContractRegister,
    manifest: ContractManifest,
    params: readonly Param[] = [],
    optionsIn?: TransactionOptions,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<PublishReceipt>> {
    const options = clientArgs.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).publishAndDeploy(
        args.assertContractRegister('contract', contract),
        clientArgs.assertContractManifestClient('manifest', manifest),
        params,
        options,
        sourceMaps,
      ),
    );
  }

  public read(network: NetworkType): ReadClient {
    return new ReadClient(
      this.getNetworkProvider(clientArgs.assertString('network', network)).read(
        clientArgs.assertString('network', network),
      ),
    );
  }
}
