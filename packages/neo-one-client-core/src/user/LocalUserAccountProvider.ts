import {
  AddressString,
  Attribute,
  ClaimTransaction,
  ClaimTransactionModel,
  common,
  crypto,
  GetOptions,
  Input,
  InputModel,
  InputOutput,
  InvocationTransaction,
  InvocationTransactionModel,
  IterOptions,
  NetworkType,
  Output,
  Param,
  RawAction,
  RelayTransactionResult,
  ScriptBuilder,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionBaseModel,
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
import { InvokeError, NothingToClaimError, NothingToTransferError, UnknownAccountError } from '../errors';
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
    transaction: TransactionBaseModel,
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
  ) => Promise<TransactionResult<T, InvocationTransaction>>;
  protected readonly executeInvokeScript: <T extends TransactionReceipt>(
    options: ExecuteInvokeScriptOptions<T>,
  ) => Promise<TransactionResult<T, InvocationTransaction>>;

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
    inputs,
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    networkFee,
    sourceMaps,
  }: {
    readonly inputs: readonly InputOutput[];
    readonly transaction: TransactionBaseModel;
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
        let transactionUnsigned = transactionUnsignedIn;
        if (this.keystore.byteLimit !== undefined) {
          transactionUnsigned = await this.consolidate({
            inputs,
            from,
            transactionUnsignedIn,
            byteLimit: this.keystore.byteLimit,
          });
        }
        const address = from.address;
        if (
          transactionUnsigned.inputs.length === 0 &&
          // tslint:disable no-any
          ((transactionUnsigned as any).claims == undefined ||
            !Array.isArray((transactionUnsigned as any).claims) ||
            (transactionUnsigned as any).claims.length === 0)
          // tslint:enable no-any
        ) {
          transactionUnsigned = transactionUnsigned.clone({
            attributes: transactionUnsigned.attributes.concat(
              this.convertAttributes([
                {
                  usage: 'Script',
                  data: address,
                },
              ]),
            ),
          });
        }

        const [signature, inputOutputs, claimOutputs] = await Promise.all([
          this.keystore.sign({
            account: from,
            message: transactionUnsigned.serializeUnsigned().toString('hex'),
          }),
          Promise.all(
            transactionUnsigned.inputs.map(async (input) =>
              this.provider.getOutput(from.network, { hash: common.uInt256ToString(input.hash), index: input.index }),
            ),
          ),
          transactionUnsigned instanceof ClaimTransactionModel
            ? Promise.all(
                transactionUnsigned.claims.map(async (input) =>
                  this.provider.getOutput(from.network, {
                    hash: common.uInt256ToString(input.hash),
                    index: input.index,
                  }),
                ),
              )
            : Promise.resolve([]),
        ]);

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
            inputOutputs: inputOutputs.concat(claimOutputs),
            address,
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

        (transactionUnsigned.inputs as readonly InputModel[]).forEach((transfer) =>
          this.mutableUsedOutputs.add(`${common.uInt256ToString(transfer.hash)}:${transfer.index}`),
        );

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
    inputs,
    outputs,
    unclaimed,
    amount,
    attributes,
    method,
    params,
    paramsZipped,
    from,
    sourceMaps,
  }: {
    readonly contract: AddressString;
    readonly inputs: readonly InputOutput[];
    readonly outputs: readonly Output[];
    readonly unclaimed: readonly Input[];
    readonly amount: BigNumber;
    readonly attributes: readonly Attribute[];
    readonly method: string;
    readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
    readonly paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>;
    readonly from: UserAccountID;
    readonly sourceMaps?: SourceMaps;
  }): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const transaction = new ClaimTransactionModel({
      inputs: this.convertInputs(inputs),
      claims: this.convertInputs(unclaimed),
      outputs: this.convertOutputs(
        outputs.concat([
          {
            address: contract,
            asset: common.GAS_ASSET_HASH,
            value: amount,
          },
        ]),
      ),
      attributes: this.convertAttributes(
        // By definition, the contract address is a claim input so the script hash is already included
        // By definition, the from address is not an input or a claim, so we need to add it
        attributes.concat(this.getInvokeAttributes(contract, method, paramsZipped, false, from.address)),
      ),
      // Since the contract address is an input, we must add a witness for it.
      scripts: this.getInvokeScripts(method, params, true),
    });

    return this.sendTransaction<ClaimTransaction>({
      inputs,
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
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>> {
    const { inputs, outputs } = await this.getTransfersInputOutputs({
      transfers: transfers.map((transfer) => ({ from, ...transfer })),
      from,
      gas: networkFee,
    });

    if (inputs.length === 0 && this.keystore.byteLimit === undefined) {
      throw new NothingToTransferError();
    }

    const transaction = new InvocationTransactionModel({
      inputs: this.convertInputs(inputs),
      outputs: this.convertOutputs(outputs),
      attributes: this.convertAttributes(attributes),
      gas: utils.ZERO,
      script: new ScriptBuilder().emitOp('PUSH1').build(),
    });

    return this.sendTransaction<InvocationTransaction>({
      from,
      transaction,
      inputs,
      onConfirm: async ({ receipt }) => receipt,
      networkFee,
    });
  }

  protected async executeClaim(
    from: UserAccountID,
    attributes: readonly Attribute[],
    networkFee: BigNumber,
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
      this.provider.getUnclaimed(from.network, from.address),
      this.getTransfersInputOutputs({
        from,
        gas: networkFee,
        transfers: [],
      }),
    ]);

    if (unclaimed.length === 0) {
      throw new NothingToClaimError(from);
    }

    const transaction = new ClaimTransactionModel({
      inputs: this.convertInputs(inputs),
      claims: this.convertInputs(unclaimed),
      outputs: this.convertOutputs(
        outputs.concat([
          {
            address: from.address,
            asset: common.GAS_ASSET_HASH,
            value: amount,
          },
        ]),
      ),
      attributes: this.convertAttributes(attributes),
    });

    return this.sendTransaction<ClaimTransaction>({
      inputs,
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
    inputs,
    outputs,
    rawInputs,
    rawOutputs,
    gas,
    scripts,
    reorderOutputs,
    onConfirm,
    sourceMaps,
  }: ExecuteInvokeScriptOptions<T>): Promise<TransactionResult<T, InvocationTransaction>> {
    const invokeTransaction = new InvocationTransactionModel({
      version: 1,
      inputs: this.convertInputs(rawInputs.concat(inputs)),
      outputs: this.convertOutputs(reorderOutputs(rawOutputs.concat(outputs))),
      attributes: this.convertAttributes(attributes),
      gas: utils.bigNumberToBN(gas, 8),
      script,
      scripts,
    });

    try {
      // tslint:disable-next-line prefer-immediate-return
      const result = await this.sendTransaction<InvocationTransaction, T>({
        from,
        inputs,
        transaction: invokeTransaction,
        onConfirm: async ({ transaction, receipt }) => {
          const data = await this.provider.getInvocationData(from.network, transaction.hash);

          return onConfirm({ transaction, receipt, data });
        },
        sourceMaps,
      });

      // tslint:disable-next-line:no-var-before-return
      return result;
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
