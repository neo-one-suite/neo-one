import {
  addressToScriptHash,
  Attribute,
  common,
  crypto,
  GetOptions,
  IterOptions,
  NetworkType,
  RawAction,
  RelayTransactionResult,
  ScriptBuilder,
  SourceMaps,
  Transaction,
  TransactionModel,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  utils,
  WitnessModel,
} from '@neo-one/client-common';
import { processActionsAndMessage } from '@neo-one/client-switch';
import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { InvokeError, UnknownAccountError } from '../errors';
import { Hash160 } from '../Hash160';
import {
  ExecuteInvokeMethodOptions,
  ExecuteInvokeScriptOptions,
  Provider as ProviderBase,
  UserAccountProviderBase,
} from './UserAccountProviderBase';

export interface KeyStore {
  /**
   * An optional limit on the total byte size the `KeyStore` is capable of signing.
   */
  readonly byteLimit?: number;
  /**
   * An `Observable` which emits the currently selected `UserAccount`.
   */
  readonly currentUserAccount$: Observable<UserAccount | undefined>;
  /**
   * @returns the currently selected `UserAccount`
   */
  readonly getCurrentUserAccount: () => UserAccount | undefined;
  /**
   * An `Observable` of all available `UserAccount`s
   */
  readonly userAccounts$: Observable<readonly UserAccount[]>;
  /**
   * @returns the available `UserAccount`s
   */
  readonly getUserAccounts: () => readonly UserAccount[];
  /**
   * Select a specific `UserAccount` as the currently selected user account.
   *
   * If the `KeyStore` implements selecting `UserAccount`s in a way that does not allow arbitrary `UserAccount`s to be programatically selected, then the `KeyStore` should only ever return one available `UserAccount` from the `userAccount$` and `getUserAccounts` properties.
   */
  readonly selectUserAccount: (id?: UserAccountID) => Promise<void>;
  /**
   * The `KeyStore` may optionally support deleting `UserAccount`s.
   */
  readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
  /**
   * The `KeyStore` may optionally support updating the `UserAccount` name.
   */
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
  /**
   * Sign an arbitrary message with the specified user account, returning a hex encoded string of the signature.
   */
  readonly sign: (options: { readonly account: UserAccountID; readonly message: string }) => Promise<string>;
}

export interface Provider extends ProviderBase {
  readonly relayTransaction: (
    network: NetworkType,
    transaction: TransactionModel,
    networkFee?: BigNumber | undefined,
  ) => Promise<RelayTransactionResult>;
}

/**
 * Implements `UserAccountProvider` using a `KeyStore` instance and a `Provider` instance.
 *
 * See the [LocalUserAccountProvider](https://neo-one.io/docs/user-accounts#LocalUserAccountProvider) section of the advanced guide for more details.
 */
export class LocalUserAccountProvider<TKeyStore extends KeyStore = KeyStore, TProvider extends Provider = Provider>
  extends UserAccountProviderBase<TProvider>
  implements UserAccountProvider {
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<readonly UserAccount[]>;
  public readonly networks$: Observable<readonly NetworkType[]>;
  public readonly keystore: TKeyStore;
  public readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
  public readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
  public readonly iterActionsRaw?: (network: NetworkType, options?: IterOptions) => AsyncIterable<RawAction>;
  protected readonly executeInvokeMethod: <T extends TransactionReceipt>(
    options: ExecuteInvokeMethodOptions<T>,
  ) => Promise<TransactionResult<T>>;
  protected readonly executeInvokeScript: <T extends TransactionReceipt>(
    options: ExecuteInvokeScriptOptions<T>,
  ) => Promise<TransactionResult<T>>;

  public constructor({ keystore, provider }: { readonly keystore: TKeyStore; readonly provider: TProvider }) {
    super({ provider });
    this.keystore = keystore;

    this.currentUserAccount$ = keystore.currentUserAccount$;
    this.userAccounts$ = keystore.userAccounts$;
    this.networks$ = provider.networks$;

    const deleteUserAccountIn = this.keystore.deleteUserAccount;
    if (deleteUserAccountIn !== undefined) {
      const deleteUserAccount = deleteUserAccountIn.bind(this.keystore);
      this.deleteUserAccount = async (id: UserAccountID): Promise<void> => {
        await deleteUserAccount(id);
      };
    }

    const updateUserAccountNameIn = this.keystore.updateUserAccountName;
    if (updateUserAccountNameIn !== undefined) {
      const updateUserAccountName = updateUserAccountNameIn.bind(this.keystore);
      this.updateUserAccountName = async (options: UpdateAccountNameOptions): Promise<void> => {
        await updateUserAccountName(options);
      };
    }

    const iterActionsRaw = this.provider.iterActionsRaw;
    if (iterActionsRaw !== undefined) {
      this.iterActionsRaw = iterActionsRaw.bind(this.keystore);
    }

    this.executeInvokeMethod = this.executeInvoke;
    this.executeInvokeScript = this.executeInvoke;
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.keystore.getCurrentUserAccount();
  }

  public getUserAccounts(): readonly UserAccount[] {
    return this.keystore.getUserAccounts();
  }

  public getNetworks(): readonly NetworkType[] {
    return this.provider.getNetworks();
  }

  public async selectUserAccount(id?: UserAccountID): Promise<void> {
    await this.keystore.selectUserAccount(id);
  }

  protected async sendTransaction<TTransaction extends Transaction, T extends TransactionReceipt = TransactionReceipt>({
    transaction: transactionUnsigned,
    from,
    onConfirm,
    networkFee,
    sourceMaps,
  }: {
    readonly transaction: TransactionModel;
    readonly from: UserAccountID;
    readonly onConfirm: (options: {
      readonly transaction: Transaction;
      readonly receipt: TransactionReceipt;
    }) => Promise<T>;
    readonly networkFee?: BigNumber;
    readonly sourceMaps?: SourceMaps;
  }): Promise<TransactionResult<T, TTransaction>> {
    return this.capture(
      async () => {
        const signature = await this.keystore.sign({
          account: from,
          message: transactionUnsigned.serializeUnsigned().toString('hex'),
        });

        const userAccount = this.getUserAccount(from);
        const witness = crypto.createWitnessForSignature(
          Buffer.from(signature, 'hex'),
          common.stringToECPoint(userAccount.publicKey),
          WitnessModel,
        );

        const result = await this.provider.relayTransaction(
          from.network,
          this.addWitness({
            transaction: transactionUnsigned,
            witness,
          }),
          networkFee,
        );
        const failures =
          result.verifyResult === undefined
            ? []
            : result.verifyResult.verifications.filter(({ failureMessage }) => failureMessage !== undefined);
        if (failures.length > 0) {
          const message = await processActionsAndMessage({
            actions: failures.reduce<readonly RawAction[]>((acc, { actions }) => acc.concat(actions), []),
            message: failures
              .map(({ failureMessage }) => failureMessage)
              .filter(commonUtils.notNull)
              .join(' '),
            sourceMaps,
          });

          throw new InvokeError(message);
        }

        const { transaction } = result;

        return {
          transaction: transaction as TTransaction,
          // tslint:disable-next-line no-unnecessary-type-annotation
          confirmed: async (optionsIn: GetOptions = {}): Promise<T> => {
            const options = {
              ...optionsIn,
              timeoutMS: optionsIn.timeoutMS === undefined ? 120000 : optionsIn.timeoutMS,
            };
            const receipt = await this.provider.getTransactionReceipt(from.network, transaction.hash, options);

            return onConfirm({ transaction, receipt });
          },
        };
      },
      {
        name: 'neo_send_transaction',
      },
    );
  }

  // protected async executeInvokeClaim({
  //   contract,
  //   unclaimedAmount,
  //   attributes,
  //   method,
  //   params,
  //   paramsZipped,
  //   from,
  //   sourceMaps,
  // }: {
  //   readonly contract: AddressString;
  //   readonly unclaimedAmount: BigNumber;
  //   readonly attributes: readonly Attribute[];
  //   readonly method: string;
  //   readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  //   readonly paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>;
  //   readonly from: UserAccountID;
  //   readonly sourceMaps?: SourceMaps;
  // }): Promise<TransactionResult> {
  //   const builder = new ScriptBuilder()
  //     .emitSysCall('System.Contract.Call', common.GAS_CONTRACT_SCRIPT_HASH, 'transfer', [
  //       addressToScriptHash(contract),
  //       common.GAS_CONTRACT_SCRIPT_HASH,
  //       unclaimedAmount.toString(),
  //     ])
  //     .build();

  //   const { gas } = await this.getSystemFee({ from, script, attributes });

  //   const transaction = new TransactionModel({
  //     systemFee: utils.bigNumberToBN(gas, 8),
  //     // Since the contract address is an input, we must add a witness for it.
  //     witnesses: this.getInvokeScripts(method, params, true),
  //     script,
  //   });

  //   return this.sendTransaction<Transaction>({
  //     from,
  //     transaction,
  //     onConfirm: async ({ receipt }) => receipt,
  //     sourceMaps,
  //   });
  // }

  // TODO: probably want to make sure an "executeTransfer" function is able to transfer any asset
  // since they're all just contract invocations now
  protected async executeTransfer(
    transfers: readonly Transfer[],
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult> {
    const sb = new ScriptBuilder();
    transfers.forEach((transfer) => {
      sb.emitSysCall(
        'System.Contract.Call',
        transfer.asset === Hash160.NEO ? common.nativeHashes.NEO : common.nativeHashes.GAS,
        'transfer',
        [addressToScriptHash(from.address), addressToScriptHash(transfer.to), transfer.amount.toString()],
      );
    });
    const script = sb.build();

    const { gas } = await this.getSystemFee({ from, attributes, script });

    const transaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(gas, 8), // TODO: check. fee for transfer method is 0.08 GAS
      networkFee: utils.bigNumberToBN(networkFee, 8), // TODO: check
      attributes: this.convertAttributes(attributes),
      script,
    });

    return this.sendTransaction<Transaction>({
      from,
      transaction,
      onConfirm: async ({ receipt }) => receipt,
      networkFee,
    });
  }

  protected async executeClaim(
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult> {
    const toAccount = this.getUserAccount(from);
    const unclaimedAmount = await this.provider.getUnclaimed(from.network, from.address);
    const toHash = crypto.toScriptHash(crypto.createSignatureRedeemScript(common.stringToECPoint(toAccount.publicKey)));
    const script = new ScriptBuilder()
      .emitSysCall('System.Contract.Call', common.nativeHashes.GAS, 'transfer', [
        addressToScriptHash(from.address),
        common.nativeHashes.GAS,
        unclaimedAmount.toString(),
      ])
      .build();

    const { gas } = await this.getSystemFee({ script, from, attributes });

    const transaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(gas, 8), // TODO: check this. check decimals
      networkFee: utils.bigNumberToBN(networkFee, 8), // TODO: check decimals
      signers: undefined, // ?
      witnesses: undefined, // ?
      script,
      attributes: this.convertAttributes(attributes),
    });

    return this.sendTransaction<Transaction>({
      from,
      transaction,
      onConfirm: async ({ receipt }) => receipt,
      networkFee,
    });
  }

  private async executeInvoke<T extends TransactionReceipt>({
    script,
    from,
    attributes,
    gas,
    witnesses,
    onConfirm,
    sourceMaps,
  }: ExecuteInvokeScriptOptions<T>): Promise<TransactionResult<T>> {
    // TODO: check
    const { gas: systemFee } = await this.getSystemFee({ attributes, script, from });
    const invokeTransaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(systemFee, 8), // TODO: check
      networkFee: utils.bigNumberToBN(gas, 8), // TODO: check
      attributes: this.convertAttributes(attributes),
      signers: [], // TODO: ?
      script,
      witnesses,
    });

    try {
      return this.sendTransaction<Transaction, T>({
        from,
        transaction: invokeTransaction,
        onConfirm: async ({ transaction, receipt }) => {
          const data = await this.provider.getInvocationData(from.network, transaction.hash);

          return onConfirm({ transaction, receipt, data });
        },
        sourceMaps,
      });
    } catch (error) {
      const message = await processActionsAndMessage({
        actions: [],
        message: error.message,
        sourceMaps,
      });
      if (message === error.message) {
        throw error;
      }

      throw new Error(message);
    }
  }

  private getUserAccount(id: UserAccountID): UserAccount {
    const userAccount = this.keystore
      .getUserAccounts()
      .find((account) => account.id.network === id.network && account.id.address === id.address);
    if (userAccount === undefined) {
      throw new UnknownAccountError(id.address);
    }

    return userAccount;
  }
}
