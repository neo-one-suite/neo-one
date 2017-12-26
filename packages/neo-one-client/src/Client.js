/* @flow */
// flowlint unclear-type:off
import type { Observable } from 'rxjs/Observable';

import { take } from 'rxjs/operators';

import type {
  ABI,
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
  TransactionReceipt,
  TransactionResult,
  InvokeReceiptInternal,
  UserAccount,
  UserAccountProvider,
} from './types'; // eslint-disable-line

import * as argAssertions from './args';
import { createSmartContract } from './sc';

// TODO: Add assertions for everything
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

  getCurrentAccount(): Promise<?UserAccount> {
    return this.currentAccount$.pipe(take(1)).toPromise();
  }

  getAccounts(): Promise<Array<UserAccount>> {
    return this.accounts$.pipe(take(1)).toPromise();
  }

  getNetworks(): Promise<Array<NetworkType>> {
    return this.networks$.pipe(take(1)).toPromise();
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

  smartContract(abi: ABI): SmartContract {
    return createSmartContract({ abi, client: (this: $FlowFixMe) });
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
    options?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    return this.userAccountProvider._invoke(
      contract,
      method,
      params,
      paramsZipped,
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
