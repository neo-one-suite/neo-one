/* @flow */
import type { Observable } from 'rxjs/Observable';

import type {
  AssetRegister,
  ContractRegister,
  Hash160String,
  RawInvocationResult,
  Param,
  ParamInternal,
  Transfer,
  NetworkType,
  TransactionOptions,
  InvokeTransactionOptions,
  PublicKeyString,
  PublishReceipt,
  RegisterAssetReceipt,
  RegisterValidatorReceipt,
  SmartContract,
  SmartContractDefinition,
  TransactionReceipt,
  TransactionResult,
  InvokeReceiptInternal,
  UserAccount,
  UserAccountProvider,
} from './types'; // eslint-disable-line

import * as argAssertions from './args';
import { createSmartContract } from './sc';

export default class Client<TUserAccountProvider: UserAccountProvider> {
  +userAccountProvider: TUserAccountProvider;
  +currentAccount$: Observable<?UserAccount>;
  +accounts$: Observable<Array<UserAccount>>;
  +networks$: Observable<Array<NetworkType>>;

  constructor(userAccountProvider: TUserAccountProvider) {
    this.userAccountProvider = userAccountProvider;
    this.currentAccount$ = userAccountProvider.currentAccount$;
    this.accounts$ = userAccountProvider.accounts$;
    this.networks$ = userAccountProvider.networks$;
  }

  getCurrentAccount(): ?UserAccount {
    return this.userAccountProvider.getCurrentAccount();
  }

  getAccounts(): Array<UserAccount> {
    return this.userAccountProvider.getAccounts();
  }

  getNetworks(): Array<NetworkType> {
    return this.userAccountProvider.getNetworks();
  }

  transfer(
    ...args: Array<any>
  ): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this._getTransfersOptions(args);

    return this.userAccountProvider.transfer(transfers, options);
  }

  claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this.userAccountProvider.claim(options);
  }

  publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this.userAccountProvider.publish(contract, options);
  }

  registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    return this.userAccountProvider.registerAsset(asset, options);
  }

  issue(...args: Array<any>): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this._getTransfersOptions(args);

    return this.userAccountProvider.transfer(transfers, options);
  }

  smartContract(definition: SmartContractDefinition): SmartContract {
    return createSmartContract({ definition, client: (this: $FlowFixMe) });
  }

  // NOTE: This API is subject to change and is not bound by semver.
  // eslint-disable-next-line
  experimental_registerValidator(
    publicKey: PublicKeyString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterValidatorReceipt>> {
    return this.userAccountProvider.experimental_registerValidator(
      publicKey,
      options,
    );
  }

  _invoke(
    contract: Hash160String,
    method: string,
    params: Array<?ParamInternal>,
    paramsZipped: Array<[string, ?Param]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    return this.userAccountProvider._invoke(
      contract,
      method,
      params,
      paramsZipped,
      verify,
      options,
    );
  }

  _call(
    contract: Hash160String,
    method: string,
    params: Array<?ParamInternal>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult> {
    return this.userAccountProvider._call(contract, method, params, options);
  }

  _getTransfersOptions(
    args: Array<any>,
  ): {|
    transfers: Array<Transfer>,
    options?: TransactionOptions,
  |} {
    let transfers = [];
    let options;
    if (args.length >= 3) {
      transfers.push({
        amount: args[0],
        asset: args[1],
        to: args[2],
      });
      // eslint-disable-next-line
      options = args[3];
    } else {
      // eslint-disable-next-line
      transfers = args[0];
      // eslint-disable-next-line
      options = args[1];
    }

    return { transfers, options };
  }
}
