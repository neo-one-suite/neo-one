import {
  AddressString,
  addressToScriptHash,
  Attribute,
  common,
  crypto,
  GetOptions,
  NetworkType,
  Param,
  RawAction,
  RelayTransactionResult,
  ScriptBuilder,
  ScriptBuilderParam,
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
          message: transactionUnsigned.message.toString('hex'),
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

  protected async executeInvokeClaim({
    contract,
    unclaimedAmount,
    attributes,
    method,
    params,
    paramsZipped, // TODO: see old executeInvokeClaim
    from,
    sourceMaps,
    networkFee,
  }: {
    readonly contract: AddressString;
    readonly unclaimedAmount: BigNumber;
    readonly attributes: readonly Attribute[];
    readonly method: string;
    readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
    readonly paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>;
    readonly from: UserAccountID;
    readonly sourceMaps?: SourceMaps;
    readonly networkFee?: BigNumber;
  }): Promise<TransactionResult> {
    const script = new ScriptBuilder()
      // TODO: check that this is correct script for claiming gas?
      .emitAppCall(common.nativeHashes.GAS, 'transfer', [
        addressToScriptHash(contract), // check this is correct address
        common.nativeHashes.GAS,
        unclaimedAmount.toString(),
      ])
      .build();

    const [{ gas }, { count, messageMagic }] = await Promise.all([
      this.getSystemFee({ from, script, attributes }),
      this.getCountAndMagic(from),
    ]);

    const transaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(gas, 8),
      networkFee: utils.bigNumberToBN(networkFee ? networkFee : new BigNumber(0), 8), // TODO: check. should it be optional param or no?
      // Since the contract address is an input, we must add a witness for it.
      witnesses: this.getInvokeScripts(method, params, true),
      script,
      attributes: this.convertAttributes(attributes),
      validUntilBlock: count + 240,
      messageMagic,
    });

    return this.sendTransaction<Transaction>({
      from,
      transaction,
      onConfirm: async ({ receipt }) => receipt,
      sourceMaps,
    });
  }

  protected async executeTransfer(
    transfers: readonly Transfer[],
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult> {
    const sb = new ScriptBuilder();
    transfers.forEach((transfer) => {
      // TODO: check transfer.asset
      sb.emitAppCall(common.stringToUInt160(transfer.asset), 'transfer', [
        addressToScriptHash(from.address),
        addressToScriptHash(transfer.to),
        transfer.amount.toString(),
      ]);
    });
    const script = sb.build();

    const [{ gas }, { count, messageMagic }] = await Promise.all([
      this.getSystemFee({ from, attributes, script }),
      this.getCountAndMagic(from),
    ]);

    const transaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(gas, 8), // TODO: check. fee for transfer method is 0.08 GAS
      networkFee: utils.bigNumberToBN(networkFee, 8), // TODO: check
      attributes: this.convertAttributes(attributes),
      script,
      validUntilBlock: count + 240,
      messageMagic,
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
      .emitAppCall(common.nativeHashes.GAS, 'transfer', [
        addressToScriptHash(from.address),
        common.nativeHashes.GAS,
        unclaimedAmount.toString(),
      ])
      .build();

    const [{ gas }, { count, messageMagic }] = await Promise.all([
      this.getSystemFee({ from, attributes, script }),
      this.getCountAndMagic(from),
    ]);

    const transaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(gas, 8), // TODO: check this. check decimals
      networkFee: utils.bigNumberToBN(networkFee, 8), // TODO: check decimals
      script,
      attributes: this.convertAttributes(attributes),
      messageMagic,
      validUntilBlock: count + 240,
    });

    return this.sendTransaction<Transaction>({
      from,
      transaction,
      onConfirm: async ({ receipt }) => receipt,
      networkFee,
    });
  }

  // TODO: see invokeScript and invokeFunction in neo-modules
  private async executeInvoke<T extends TransactionReceipt>({
    script,
    from,
    attributes,
    systemFee,
    networkFee,
    witnesses,
    onConfirm,
    sourceMaps,
  }: ExecuteInvokeScriptOptions<T>): Promise<TransactionResult<T>> {
    const { count, messageMagic } = await this.getCountAndMagic(from);
    const invokeTransaction = new TransactionModel({
      systemFee: utils.bigNumberToBN(systemFee, 8), // TODO: check
      networkFee: utils.bigNumberToBN(networkFee ? networkFee : new BigNumber(0), 8), // TODO: check. should it be optional param or no?
      attributes: this.convertAttributes(attributes),
      script,
      witnesses,
      validUntilBlock: count + 240,
      messageMagic,
    });

    try {
      return this.sendTransaction<Transaction, T>({
        from,
        transaction: invokeTransaction,
        onConfirm: async ({ transaction, receipt }) => {
          const data = await this.provider.getApplicationLogData(from.network, transaction.hash);

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
