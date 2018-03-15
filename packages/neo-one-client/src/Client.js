/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import type { Observable } from 'rxjs/Observable';
import type { Param as ScriptBuilderParam } from '@neo-one/client-core';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import type {
  AssetRegister,
  ContractRegister,
  Hash160String,
  RawInvocationResult,
  Param,
  Transfer,
  NetworkType,
  TransactionOptions,
  InvokeTransactionOptions,
  PublishReceipt,
  RegisterAssetReceipt,
  SmartContract,
  SmartContractDefinition,
  TransactionReceipt,
  TransactionResult,
  InvokeReceiptInternal,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
} from './types';
import ReadClient from './ReadClient';
import { UnknownAccountError, UnknownNetworkError } from './errors';

import * as argAssertions from './args';
import { createSmartContract } from './sc';

const clients = [];

export default class Client<TUserAccountProviders: $FlowFixMe> {
  +currentAccount$: Observable<?UserAccount>;
  +accounts$: Observable<Array<UserAccount>>;
  +networks$: Observable<Array<NetworkType>>;
  +_providers$: BehaviorSubject<TUserAccountProviders>;
  +_selectedProvider$: BehaviorSubject<UserAccountProvider>;

  constructor(providersIn: TUserAccountProviders) {
    const providersArray = utils.values(providersIn);
    const providerIn =
      providersArray.find(provider => provider.getCurrentAccount() != null) ||
      providersArray[0];
    if (providerIn == null) {
      throw new Error('At least one provider is required');
    }

    if (
      utils
        .entries(providersIn)
        .some(([type, provider]) => type !== provider.type)
    ) {
      throw new Error('Provider keys must be named the same as their type');
    }

    this._providers$ = new BehaviorSubject(providersIn);
    this._selectedProvider$ = new BehaviorSubject(providerIn);

    this.currentAccount$ = this._selectedProvider$.pipe(
      switchMap(provider => provider.currentAccount$),
    );
    this.accounts$ = this._providers$.pipe(
      switchMap(providers =>
        combineLatest(
          utils.values(providers).map(provider => provider.accounts$),
        ),
      ),
      map(accountss =>
        accountss.reduce((acc, accounts) => acc.concat(accounts), []),
      ),
    );
    this.networks$ = this._providers$.pipe(
      switchMap(providers =>
        combineLatest(
          utils.values(providers).map(provider => provider.networks$),
        ),
      ),
      map(networkss => [
        ...new Set(
          networkss.reduce((acc, networks) => acc.concat(networks), []),
        ),
      ]),
    );

    clients.push(this);

    if (this.getCurrentAccount() == null) {
      this.accounts$
        .pipe(filter(accounts => accounts.length > 0), take(1))
        .toPromise()
        .then(async accounts => {
          const account = accounts[0];
          if (this.getCurrentAccount() == null && account != null) {
            await this.selectAccount(account.id);
          }
        })
        .catch(() => {
          // Just ignore errors here.
        });
    }
  }

  get providers(): TUserAccountProviders {
    return this._providers$.value;
  }

  getAccount(id: UserAccountID): UserAccount {
    const provider = this._getProvider({ from: id });
    const account = provider
      .getAccounts()
      .find(
        acct =>
          acct.id.network === id.network && acct.id.address === id.address,
      );
    /* istanbul ignore if  */
    if (account == null) {
      throw new UnknownAccountError(id.address);
    }

    return account;
  }

  async selectAccount(id?: UserAccountID): Promise<void> {
    const provider = this._getProvider({ from: id });
    await provider.selectAccount(id);
    this._selectedProvider$.next(provider);
  }

  async deleteAccount(id: UserAccountID): Promise<void> {
    await this._getProvider({ from: id }).deleteAccount(id);
  }

  async updateAccountName({
    id,
    name,
  }: UpdateAccountNameOptions): Promise<void> {
    await this._getProvider({ from: id }).updateAccountName({ id, name });
  }

  getCurrentAccount(): ?UserAccount {
    return this._selectedProvider$.value.getCurrentAccount();
  }

  getAccounts(): Array<UserAccount> {
    return utils
      .values(this.providers)
      .reduce((acc, provider) => acc.concat(provider.getAccounts()), []);
  }

  getNetworks(): Array<NetworkType> {
    return [
      ...new Set(
        utils
          .values(this.providers)
          .reduce((acc, provider) => acc.concat(provider.getNetworks()), []),
      ),
    ];
  }

  transfer(
    ...args: Array<any>
  ): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this._getTransfersOptions(args);

    return this._getProvider(options).transfer(transfers, options);
  }

  claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this._getProvider(options).claim(options);
  }

  publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this._getProvider(options).publish(contract, options);
  }

  registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    return this._getProvider(options).registerAsset(asset, options);
  }

  issue(...args: Array<any>): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this._getTransfersOptions(args);
    return this._getProvider(options).issue(transfers, options);
  }

  read(network: NetworkType): ReadClient<any> {
    return new ReadClient(this._getNetworkProvider(network).read(network));
  }

  smartContract(definition: SmartContractDefinition): SmartContract {
    return createSmartContract({ definition, client: (this: $FlowFixMe) });
  }

  _invoke(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
    paramsZipped: Array<[string, ?Param]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    return this._getProvider(options).invoke(
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
    params: Array<?ScriptBuilderParam>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult> {
    return this._getProvider(options).call(contract, method, params, options);
  }

  inject(provider: UserAccountProvider): void {
    this._providers$.next(
      ({
        ...this.providers,
        [provider.type]: provider,
      }: $FlowFixMe),
    );
    this._selectedProvider$.next(provider);
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

  _getProvider(
    options?: TransactionOptions | InvokeTransactionOptions,
  ): UserAccountProvider {
    const { from } = options || {};
    if (from == null) {
      return this._selectedProvider$.value;
    }

    const providers = utils.values(this.providers);
    const accountProvider = providers.find(provider =>
      provider
        .getAccounts()
        .some(
          account =>
            account.id.network === from.network &&
            account.id.address === from.address,
        ),
    );
    if (accountProvider == null) {
      throw new UnknownAccountError(from.address);
    }

    return accountProvider;
  }

  _getNetworkProvider(network: NetworkType): UserAccountProvider {
    const providers = utils.values(this.providers);
    const accountProvider = providers.find(provider =>
      provider.getAccounts().some(account => account.id.network === network),
    );
    if (accountProvider == null) {
      throw new UnknownNetworkError(network);
    }

    return accountProvider;
  }

  static inject(provider: UserAccountProvider): void {
    clients.forEach(client => client.inject(provider));
  }
}
