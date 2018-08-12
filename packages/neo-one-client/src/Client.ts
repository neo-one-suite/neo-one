import { ScriptBuilderParam } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { RawSourceMap } from 'source-map';
import * as argAssertions from './args';
import { ClientBase } from './ClientBase';
import { ReadClient } from './ReadClient';
import { createSmartContract } from './sc';
import {
  AddressString,
  AssetRegister,
  ContractRegister,
  Hash160String,
  Hash256String,
  InvokeTransactionOptions,
  NetworkType,
  Param,
  PublishReceipt,
  RawCallReceipt,
  RawInvokeReceipt,
  RegisterAssetReceipt,
  SmartContract,
  SmartContractAny,
  SmartContractDefinition,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccountProvider,
} from './types';
const mutableClients: Client[] = [];

export class Client<
  // tslint:disable-next-line no-any
  TUserAccountProviders extends { readonly [K: string]: UserAccountProvider } = any
> extends ClientBase<TUserAccountProviders> {
  public static inject(provider: UserAccountProvider): void {
    mutableClients.forEach((client) => client.inject(provider));
  }

  public constructor(providersIn: TUserAccountProviders) {
    super(providersIn);
    mutableClients.push(this);
  }

  public async transfer(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  public async transfer(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  // tslint:disable-next-line readonly-array no-any
  public async transfer(...args: any[]): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);

    return this.getProvider(options).transfer(transfers, options);
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt>> {
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).claim(options);
  }

  public async publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    argAssertions.assertTransactionOptions(options);
    argAssertions.assertContractRegister(contract);

    return this.getProvider(options).publish(contract, options);
  }

  public async registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    argAssertions.assertAssetRegister(asset);
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).registerAsset(asset, options);
  }

  public async issue(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  public async issue(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  // tslint:disable-next-line readonly-array no-any
  public async issue(...args: any[]): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);

    return this.getProvider(options).issue(transfers, options);
  }

  public read(network: NetworkType): ReadClient {
    return new ReadClient(this.getNetworkProvider(network).read(network));
  }

  // tslint:disable-next-line no-any
  public smartContract<T extends SmartContract<any> = SmartContractAny>(definition: SmartContractDefinition): T {
    argAssertions.assertSmartContractDefinition(definition);

    // tslint:disable-next-line no-any
    return createSmartContract({ definition, client: this }) as any;
  }

  public inject<K>(
    provider: K extends keyof TUserAccountProviders ? TUserAccountProviders[K] : UserAccountProvider,
  ): void {
    this.providers$.next(
      // tslint:disable-next-line prefer-object-spread
      Object.assign({}, this.providers, {
        [provider.type]: provider,
      }),
    );

    this.selectedProvider$.next(provider);
  }

  // internal
  public async __invoke(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
    sourceMap?: RawSourceMap,
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    argAssertions.assertHash160(contract);
    argAssertions.assertBoolean(verify);

    return this.getProvider(options).invoke(contract, method, params, paramsZipped, verify, options, sourceMap);
  }

  public async __call(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    options?: TransactionOptions,
  ): Promise<RawCallReceipt> {
    argAssertions.assertHash160(contract);
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).call(contract, method, params, options);
  }

  private getTransfersOptions(
    // tslint:disable-next-line no-any
    args: ReadonlyArray<any>,
  ): {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly options?: TransactionOptions;
  } {
    argAssertions.assertTransfers(args);
    let transfers;
    let options;
    if (args.length >= 3) {
      transfers = [
        {
          amount: args[0],
          asset: args[1],
          to: args[2],
        },
      ];

      options = args[3];
    } else {
      transfers = args[0];
      options = args[1];
    }

    return { transfers, options };
  }
}
