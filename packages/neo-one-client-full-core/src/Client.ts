import {
  ABI,
  AddressString,
  Hash256String,
  InvocationTransaction,
  IssueTransaction,
  NetworkType,
  Param,
  SourceMaps,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
} from '@neo-one/client-common';
import { args as clientArgs, Client as ClientLite } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import * as args from './args';
import { ReadClient } from './ReadClient';
import {
  AssetRegister,
  ContractRegister,
  PublishReceipt,
  RegisterAssetReceipt,
  UserAccountProvider,
  UserAccountProviders,
} from './types';

// tslint:disable-next-line no-any
export class Client<TUserAccountProviders extends UserAccountProviders = any> extends ClientLite<
  UserAccountProvider,
  TUserAccountProviders
> {
  public async publish(
    contract: ContractRegister,
    optionsIn?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    const options = clientArgs.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).publish(args.assertContractRegister('contract', contract), options),
    );
  }

  public async publishAndDeploy(
    contract: ContractRegister,
    abi: ABI,
    params: readonly Param[] = [],
    optionsIn?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    const options = clientArgs.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).publishAndDeploy(
        args.assertContractRegister('contract', contract),
        clientArgs.assertABI('abi', abi),
        params,
        options,
        sourceMaps,
      ),
    );
  }

  public async registerAsset(
    asset: AssetRegister,
    optionsIn?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>> {
    const options = clientArgs.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).registerAsset(args.assertAssetRegister('asset', asset), options),
    );
  }

  public async issue(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  public async issue(
    transfers: readonly Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  // tslint:disable-next-line readonly-array no-any
  public async issue(...argsIn: any[]): Promise<TransactionResult<TransactionReceipt, IssueTransaction>> {
    const { transfers, options } = this.getTransfersOptions(argsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(this.getProvider(options).issue(transfers, options));
  }

  public read(network: NetworkType): ReadClient {
    return new ReadClient(
      this.getNetworkProvider(clientArgs.assertString('network', network)).read(
        clientArgs.assertString('network', network),
      ),
    );
  }
}
