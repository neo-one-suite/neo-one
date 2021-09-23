import {
  Account,
  AddressString,
  Block,
  GetOptions,
  Hash256String,
  InvokeSendUnsafeReceiveTransactionOptions,
  IterOptions,
  NetworkType,
  Param,
  RawAction,
  RawCallReceipt,
  RawInvokeReceipt,
  ScriptBuilderParam,
  SourceMaps,
  TransactionOptions,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
} from '@neo-one/client-common';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { Endpoint, Message } from './messageTypes';
import { deserialize, serialize } from './serializeUtils';

// tslint:disable no-let
let messageID = 0;
const getID = () => {
  const currentID = messageID;
  messageID = currentID === Number.MAX_SAFE_INTEGER ? 0 : messageID + 1;

  return `${currentID}`;
};

const handleReceiveResponse = async (id: string, messageEndpoint: Endpoint) =>
  // tslint:disable-next-line no-any
  new Promise<any>((resolve, reject) => {
    function listener(event: Message) {
      if (event.id === id && event.type !== 'NEXT') {
        if (event.type === 'RETURN') {
          resolve(deserialize(event.value));
        }
        if (event.type === 'ERROR') {
          reject(deserialize(event.value));
        }
      }
    }

    messageEndpoint.addEventListener(listener);
  });

async function* asyncGenerator(messageEndpoint: Endpoint, method: string, network: NetworkType, options?: IterOptions) {
  const id = getID();
  messageEndpoint.postMessage({
    type: 'ASYNCITERABLE',
    method,
    args: [serialize(network), serialize(options)],
    id,
  });
  // tslint:disable-next-line:no-loop-statement
  while (true) {
    // tslint:disable-next-line no-any
    const rawActionIterator = handleReceiveResponse(id, messageEndpoint);
    messageEndpoint.postMessage({ type: 'NEXT', id });

    const result = await rawActionIterator;
    if (result.done) {
      break;
    }

    yield result.value;
  }
}

export class RemoteUserAccountProvider implements UserAccountProvider {
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<readonly UserAccount[]>;
  public readonly networks$: Observable<readonly NetworkType[]>;
  private readonly messageEndpoint: Endpoint;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly userAccountsInternal$: BehaviorSubject<readonly UserAccount[]>;
  private readonly networksInternal$: BehaviorSubject<readonly NetworkType[]>;

  public constructor({ endpoint }: { readonly endpoint: Endpoint }) {
    this.messageEndpoint = endpoint;

    this.userAccountsInternal$ = new BehaviorSubject<readonly UserAccount[]>([]);
    this.currentAccountInternal$ = new BehaviorSubject<UserAccount | undefined>(undefined);
    this.networksInternal$ = new BehaviorSubject<readonly NetworkType[]>([]);
    this.messageEndpoint.addEventListener((event: Message) => {
      switch (event.type) {
        case 'OBSERVABLE': {
          if (event.id === 'userAccounts$') {
            this.userAccountsInternal$.next(deserialize(event.value) as readonly UserAccount[]);
          }
          if (event.id === 'currentUserAccount$') {
            this.currentAccountInternal$.next(deserialize(event.value) as UserAccount | undefined);
          }
          if (event.id === 'networks$') {
            this.networksInternal$.next(deserialize(event.value) as readonly NetworkType[]);
          }
          break;
        }
        case 'ERROR': {
          try {
            deserialize(event.value);
          } catch (error) {
            if (event.id === 'userAccounts$') {
              this.userAccountsInternal$.error(error);
            }
            if (event.id === 'currentUserAccount$') {
              this.currentAccountInternal$.error(error);
            }
            if (event.id === 'networks$') {
              this.networksInternal$.error(error);
            }
          }
          break;
        }
        case 'RETURN': {
          if (event.id === 'userAccounts$') {
            this.userAccountsInternal$.complete();
          }
          if (event.id === 'currentUserAccount$') {
            this.currentAccountInternal$.complete();
          }
          if (event.id === 'networks$') {
            this.networksInternal$.complete();
          }
          break;
        }
        default:
      }
    });
    this.userAccounts$ = this.userAccountsInternal$;
    this.currentUserAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());
    this.networks$ = this.networksInternal$;
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public async selectUserAccount(userAccountID?: UserAccountID): Promise<void> {
    const result = await this.handleRelayMethod({
      method: 'selectUserAccount',
      args: [userAccountID],
    });

    return result.result;
  }

  public async deleteUserAccount(userAccountID?: UserAccountID): Promise<void> {
    const result = await this.handleRelayMethod({ method: 'deleteUserAccount', args: [userAccountID] });

    return result.result;
  }

  public getUserAccounts(): readonly UserAccount[] {
    return this.userAccountsInternal$.getValue();
  }

  public getNetworks(): readonly NetworkType[] {
    return this.networksInternal$.getValue();
  }

  public async updateUserAccountName(options: UpdateAccountNameOptions): Promise<void> {
    const result = await this.handleRelayMethod({ method: 'updateUserAccountName', args: [options] });

    return result.result;
  }

  public async getBlockCount(network: NetworkType): Promise<number> {
    const result = await this.handleRelayMethod({ method: 'getBlockCount', args: [network] });

    return result.result;
  }

  public async getAccount(network: NetworkType, address: AddressString): Promise<Account> {
    const result = await this.handleRelayMethod({ method: 'getAccount', args: [network, address] });

    return result.result;
  }

  public iterBlocks(network: NetworkType, options?: IterOptions): AsyncIterable<Block> {
    return asyncGenerator(this.messageEndpoint, 'iterBlocks', network, options);
  }

  public iterActionsRaw(network: NetworkType, options?: IterOptions): AsyncIterable<RawAction> {
    return asyncGenerator(this.messageEndpoint, 'iterActionsRaw', network, options);
  }

  public async transfer(transfers: readonly Transfer[], options?: TransactionOptions): Promise<TransactionResult> {
    return this.handleMethodWithConfirmation({
      method: 'transfer',
      args: [transfers, options],
    });
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult> {
    return this.handleMethodWithConfirmation({ method: 'claim', args: [options] });
  }

  public async invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps?: SourceMaps,
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    return this.handleMethodWithConfirmation({
      method: 'invoke',
      args: [contract, method, params, paramsZipped, options, sourceMaps],
    });
  }

  public async invokeSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    transfer: Transfer,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    return this.handleMethodWithConfirmation({
      method: 'invokeSend',
      args: [contract, method, params, paramsZipped, transfer, options, sourceMaps],
    });
  }

  public async invokeCompleteSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    return this.handleMethodWithConfirmation({
      method: 'invokeCompleteSend',
      args: [contract, method, params, paramsZipped, hash, options, sourceMaps],
    });
  }

  public async invokeRefundAssets(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    return this.handleMethodWithConfirmation({
      method: 'invokeRefundAssets',
      args: [contract, method, params, paramsZipped, hash, options, sourceMaps],
    });
  }

  public async invokeClaim(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ): Promise<TransactionResult> {
    return this.handleMethodWithConfirmation({
      method: 'invokeClaim',
      args: [contract, method, params, paramsZipped, options, sourceMaps],
    });
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const result = await this.handleRelayMethod({
      method: 'call',
      args: [network, contract, method, params],
    });

    return result.result;
  }

  private async handleRelayMethod({
    method,
    args,
    confirm = false,
  }: {
    readonly method: string;
    // tslint:disable-next-line no-any
    readonly args: readonly any[];
    readonly confirm?: boolean;
  }) {
    const id = getID();
    this.messageEndpoint.postMessage({
      type: 'METHOD',
      method,
      confirm,
      args: args.map(serialize),
      id,
    });

    const result = await handleReceiveResponse(id, this.messageEndpoint);

    return { id, result };
  }

  private handleConfirmation(id: string) {
    return async (options?: GetOptions) => {
      this.messageEndpoint.postMessage({
        type: 'CONFIRMATION',
        method: 'confirmed',
        args: [serialize(options)],
        id,
      });

      return handleReceiveResponse(id, this.messageEndpoint);
    };
  }

  private async handleMethodWithConfirmation({
    method,
    args,
  }: {
    readonly method: string;
    // tslint:disable-next-line no-any
    readonly args: readonly any[];
  }) {
    const result = await this.handleRelayMethod({
      method,
      args,
      confirm: true,
    });

    return {
      ...result.result,
      confirmed: this.handleConfirmation(result.id),
    };
  }
}
