import {
  AddressString,
  addressToScriptHash,
  AttributeUsageModel,
  ClaimTransaction,
  ClaimTransactionModel,
  common,
  crypto,
  GetOptions,
  InputModel,
  InputOutput,
  InvocationTransaction,
  InvocationTransactionModel,
  IterOptions,
  NetworkType,
  Output,
  OutputModel,
  Param,
  RawAction,
  RawCallReceipt,
  ScriptBuilder,
  ScriptBuilderParam,
  SourceMaps,
  Transaction,
  TransactionBaseModel,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UInt160AttributeModel,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  utils,
  Witness,
  WitnessModel,
} from '@neo-one/client-common';
import { processActionsAndMessage } from '@neo-one/client-switch';
import { Counter, Histogram, Labels, metrics, Monitor } from '@neo-one/monitor';
import { labels as labelNames, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { Observable } from 'rxjs';
import {
  InvalidTransactionError,
  InvokeError,
  NothingToClaimError,
  NothingToTransferError,
  UnknownAccountError,
} from '../errors';
import { converters } from './converters';
import { InvokeRawOptions, Provider, UserAccountProviderBase } from './UserAccountProviderBase';

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
  readonly selectUserAccount: (id?: UserAccountID, monitor?: Monitor) => Promise<void>;
  /**
   * The `KeyStore` may optionally support deleting `UserAccount`s.
   */
  readonly deleteUserAccount?: (id: UserAccountID, monitor?: Monitor) => Promise<void>;
  /**
   * The `KeyStore` may optionally support updating the `UserAccount` name.
   */
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
  /**
   * Sign an arbitrary message with the specified user account, returning a hex encoded string of the signature.
   */
  readonly sign: (options: {
    readonly account: UserAccountID;
    readonly message: string;
    readonly monitor?: Monitor;
  }) => Promise<string>;
}

const NEO_TRANSFER_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_transfer_duration_seconds',
});

const NEO_TRANSFER_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_transfer_failures_total',
});

const NEO_CLAIM_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_claim_duration_seconds',
});

const NEO_CLAIM_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_claim_failures_total',
});

const NEO_INVOKE_RAW_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_invoke_raw_duration_seconds',
  labelNames: [labelNames.INVOKE_RAW_METHOD],
});

const NEO_INVOKE_RAW_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_invoke_raw_failures_total',
  labelNames: [labelNames.INVOKE_RAW_METHOD],
});

/**
 * Implements `UserAccountProvider` using a `KeyStore` instance and a `Provider` instance.
 *
 * See the [LocalUserAccountProvider](https://neo-one.io/docs/user-accounts#LocalUserAccountProvider) section of the advanced guide for more details.
 */
export class LocalUserAccountProvider<TKeyStore extends KeyStore, TProvider extends Provider>
  extends UserAccountProviderBase<TProvider>
  implements UserAccountProvider {
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<readonly UserAccount[]>;
  public readonly networks$: Observable<readonly NetworkType[]>;
  public readonly keystore: TKeyStore;

  public constructor({ keystore, provider }: { readonly keystore: TKeyStore; readonly provider: TProvider }) {
    super({ provider });
    this.keystore = keystore;

    this.currentUserAccount$ = keystore.currentUserAccount$;
    this.userAccounts$ = keystore.userAccounts$;
    this.networks$ = provider.networks$;

    const deleteUserAccountIn = this.keystore.deleteUserAccount;
    if (deleteUserAccountIn !== undefined) {
      const deleteUserAccount = deleteUserAccountIn.bind(this.keystore);
      this.deleteUserAccount = async (id: UserAccountID, monitor?: Monitor): Promise<void> => {
        await deleteUserAccount(id, monitor);
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

  public async transfer(
    transfers: readonly Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: transfers.map((transfer) => ({ from, ...transfer })),
          from,
          gas: networkFee,
          provider: this.provider,
          monitor: span,
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
          monitor: span,
        });
      },
      {
        name: 'neo_transfer',
        metric: {
          total: NEO_TRANSFER_DURATION_SECONDS,
          error: NEO_TRANSFER_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, from.address, span),
          this.getTransfersInputOutputs({
            from,
            gas: networkFee,
            transfers: [],
            provider: this.provider,
            monitor: span,
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
          monitor: span,
        });
      },
      {
        name: 'neo_claim',
        metric: {
          total: NEO_CLAIM_DURATION_SECONDS,
          error: NEO_CLAIM_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  public async invokeClaim(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    options: TransactionOptions = {},
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const { from, attributes, networkFee, monitor } = this.getTransactionOptions(options);

    return this.capture(
      async (span) => {
        const [{ unclaimed, amount }, { inputs, outputs }] = await Promise.all([
          this.provider.getUnclaimed(from.network, contract, span),
          this.getTransfersInputOutputs({
            from,
            gas: networkFee,
            transfers: [],
            provider: this.provider,
            monitor: span,
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
          monitor: span,
          sourceMaps,
        });
      },
      {
        name: 'neo_claim',
        metric: {
          total: NEO_CLAIM_DURATION_SECONDS,
          error: NEO_CLAIM_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    return this.provider.call(network, contract, method, params, monitor);
  }

  public async selectUserAccount(id?: UserAccountID, monitor?: Monitor): Promise<void> {
    await this.keystore.selectUserAccount(id, monitor);
  }

  protected async invokeRaw<T extends TransactionReceipt>({
    transfers = [],
    options = {},
    invokeMethodOptions,
    onConfirm,
    method,
    scripts = [],
    labels = {},
    rawInputs = [],
    rawOutputs = [],
    script: scriptIn,
    sourceMaps,
    reorderOutputs = (outputs) => outputs,
  }: InvokeRawOptions<T>): Promise<TransactionResult<T, InvocationTransaction>> {
    const { from, script, attributes: attributesIn, networkFee, systemFee, monitor } = this.invokeRawSetup(
      options,
      invokeMethodOptions,
      scriptIn,
    );

    return this.capture(
      async (span) => {
        const { gas, attributes, inputs, outputs } = await this.invokeRawGetInputsOutputs(
          script,
          from,
          networkFee,
          systemFee,
          attributesIn,
          transfers,
          rawInputs,
          rawOutputs,
          scripts,
          sourceMaps,
          span,
        );

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
            monitor: span,
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
      },
      {
        name: 'neo_invoke_raw',
        labels: {
          ...labels,
          [labelNames.INVOKE_RAW_METHOD]: method,
        },

        metric: {
          total: NEO_INVOKE_RAW_DURATION_SECONDS,
          error: NEO_INVOKE_RAW_FAILURES_TOTAL,
        },
      },
      monitor,
    );
  }

  protected async sendTransaction<TTransaction extends Transaction, T extends TransactionReceipt = TransactionReceipt>({
    inputs,
    transaction: transactionUnsignedIn,
    from,
    onConfirm,
    sourceMaps,
    monitor,
  }: {
    readonly inputs: readonly InputOutput[];
    readonly transaction: TransactionBaseModel;
    readonly from: UserAccountID;
    readonly onConfirm: (options: {
      readonly transaction: Transaction;
      readonly receipt: TransactionReceipt;
    }) => Promise<T>;
    readonly sourceMaps?: Promise<SourceMaps>;
    readonly monitor?: Monitor;
  }): Promise<TransactionResult<T, TTransaction>> {
    return this.capture(
      async (span) => {
        let transactionUnsigned = transactionUnsignedIn;
        if (this.keystore.byteLimit !== undefined) {
          transactionUnsigned = await this.consolidate({
            inputs,
            from,
            transactionUnsignedIn,
            monitor,
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
            monitor: span,
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
          })
            .serializeWire()
            .toString('hex'),
          span,
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
      monitor,
    );
  }

  protected async consolidate({
    inputs,
    transactionUnsignedIn,
    from,
    monitor,
    byteLimit,
  }: {
    readonly transactionUnsignedIn: TransactionBaseModel;
    readonly inputs: readonly InputOutput[];
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
    readonly byteLimit: number;
  }): Promise<TransactionBaseModel> {
    const messageSize = transactionUnsignedIn.serializeUnsigned().length;

    const getMessageSize = ({
      numNewInputs,
      numNewOutputs = 0,
    }: {
      readonly numNewInputs: number;
      readonly numNewOutputs?: number;
    }): number => messageSize + numNewInputs * InputModel.size + numNewOutputs * OutputModel.size;

    const { unspentOutputs: consolidatableUnspents } = await this.getUnspentOutputs({ from, monitor });
    const assetToInputOutputsUnsorted = consolidatableUnspents
      .filter((unspent) => !inputs.some((input) => unspent.hash === input.hash && unspent.index === input.index))
      .reduce<{ [key: string]: readonly InputOutput[] }>((acc, unspent) => {
        if ((acc[unspent.asset] as readonly InputOutput[] | undefined) !== undefined) {
          return {
            ...acc,
            [unspent.asset]: acc[unspent.asset].concat([unspent]),
          };
        }

        return {
          ...acc,
          [unspent.asset]: [unspent],
        };
      }, {});

    const assetToInputOutputs = Object.entries(assetToInputOutputsUnsorted).reduce(
      (acc: typeof assetToInputOutputsUnsorted, [_asset, outputs]) => ({
        ...acc,
        [_asset]: outputs.slice().sort((coinA, coinB) => coinA.value.comparedTo(coinB.value)),
      }),
      assetToInputOutputsUnsorted,
    );

    const { newInputs, updatedOutputs, remainingAssetToInputOutputs } = transactionUnsignedIn.outputs.reduce(
      (
        acc: {
          readonly newInputs: readonly InputModel[];
          readonly updatedOutputs: readonly OutputModel[];
          readonly remainingAssetToInputOutputs: typeof assetToInputOutputs;
        },
        output,
      ) => {
        const asset = common.uInt256ToString(output.asset);

        const unspentOutputsIn = acc.remainingAssetToInputOutputs[asset] as readonly InputOutput[] | undefined;

        const unspentOutputs =
          unspentOutputsIn === undefined || common.uInt160ToString(output.address) !== addressToScriptHash(from.address)
            ? []
            : acc.remainingAssetToInputOutputs[asset];

        const tempIns = unspentOutputs.slice(
          0,
          Math.max(
            Math.floor((byteLimit - getMessageSize({ numNewInputs: acc.newInputs.length })) / InputModel.size),
            0,
          ),
        );

        return {
          newInputs: acc.newInputs.concat(this.convertInputs(tempIns)),
          updatedOutputs: acc.updatedOutputs.concat([
            output.clone({
              value: output.value.add(
                utils.bigNumberToBN(tempIns.reduce((left, right) => left.plus(right.value), new BigNumber('0')), 8),
              ),
            }),
          ]),

          remainingAssetToInputOutputs:
            unspentOutputsIn === undefined
              ? acc.remainingAssetToInputOutputs
              : {
                  ...acc.remainingAssetToInputOutputs,
                  [asset]: unspentOutputsIn.slice(tempIns.length),
                },
        };
      },
      {
        newInputs: [],
        updatedOutputs: [],
        remainingAssetToInputOutputs: assetToInputOutputs,
      },
    );

    const { finalInputs, newOutputs } = _.sortBy(
      // tslint:disable-next-line no-unused
      Object.entries(remainingAssetToInputOutputs).filter(([_asset, outputs]) => outputs.length >= 2),
      ([asset]) => {
        if (asset === common.NEO_ASSET_HASH) {
          return 0;
        }

        if (asset === common.GAS_ASSET_HASH) {
          return 1;
        }

        return 2;
      },
    ).reduce(
      (
        acc: {
          readonly finalInputs: readonly InputModel[];
          readonly newOutputs: readonly OutputModel[];
        },
        [asset, outputs],
      ) => {
        const newUnspents = outputs.slice(
          0,
          Math.max(
            0,
            Math.floor(
              (byteLimit -
                getMessageSize({ numNewInputs: acc.finalInputs.length, numNewOutputs: acc.newOutputs.length }) -
                OutputModel.size) /
                InputModel.size,
            ),
          ),
        );

        return {
          finalInputs: acc.finalInputs.concat(this.convertInputs(newUnspents)),
          newOutputs:
            newUnspents.length === 0
              ? acc.newOutputs
              : acc.newOutputs.concat(
                  this.convertOutputs([
                    {
                      asset,
                      value: newUnspents.reduce((left, right) => left.plus(right.value), new BigNumber('0')),
                      address: from.address,
                    },
                  ]),
                ),
        };
      },
      { finalInputs: newInputs, newOutputs: [] },
    );

    return transactionUnsignedIn.clone({
      inputs: transactionUnsignedIn.inputs.concat(finalInputs),
      outputs: updatedOutputs.concat(newOutputs),
    });
  }

  /*
      This function returns one of two options:
        1. For invocations -> 2 witnesses
        2. All else -> 1 witness
      We do some basic verification to make sure our assumptions at this point are
      correct, that is:
        - If we have 2 script attributes:
          - 1 of them is = to scriptHash
          - We have 1 witness
        - If we have 1 script attribute and it is = to script hash
          - We have 0 witness
        - If we have 1 script attribute and it is != to script hash
          - We have 1 witness
    */
  protected addWitness({
    transaction,
    inputOutputs,
    address,
    witness,
  }: {
    readonly transaction: TransactionBaseModel;
    readonly inputOutputs: readonly Output[];
    readonly address: AddressString;
    readonly witness: WitnessModel;
  }): TransactionBaseModel {
    const scriptAttributes = transaction.attributes.filter(
      (attribute): attribute is UInt160AttributeModel => attribute.usage === AttributeUsageModel.Script,
    );
    const scriptHash = addressToScriptHash(address);
    const scriptHashes = [
      ...new Set(
        inputOutputs
          .map((inputOutput) => addressToScriptHash(inputOutput.address))
          .concat(scriptAttributes.map((attribute) => common.uInt160ToString(attribute.value))),
      ),
    ].filter((otherHash) => otherHash !== scriptHash);

    if (scriptHashes.length === 1) {
      if (transaction.scripts.length !== 1) {
        throw new InvalidTransactionError('Something went wrong! Expected 1 script.');
      }

      const otherHash = scriptHashes[0];
      const otherScript = transaction.scripts[0];

      return transaction.clone({
        scripts: _.sortBy<[string, WitnessModel]>(
          [[scriptHash, witness], [otherHash, otherScript]],
          [(value: [string, WitnessModel]) => value[0]],
        ).map((value) => value[1]),
      });
    }

    if (scriptHashes.length === 0) {
      if (transaction.scripts.length !== 0) {
        throw new InvalidTransactionError('Something went wrong! Expected 0 scripts.');
      }

      return transaction.clone({ scripts: [witness] });
    }

    throw new InvalidTransactionError('Something went wrong!');
  }

  protected async getUnspentOutputs({
    from,
    monitor,
  }: {
    readonly from: UserAccountID;
    readonly monitor?: Monitor;
  }): Promise<{ readonly unspentOutputs: ReadonlyArray<InputOutput>; readonly wasFiltered: boolean }> {
    return this.getUnspentOutputsBase({ from, provider: this.provider, monitor });
  }

  protected convertWitness(script: Witness): WitnessModel {
    return converters.witness(script);
  }

  protected async capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    {
      name,
      labels = {},
      metric,
    }: {
      readonly name: string;
      readonly labels?: Labels;
      readonly metric?: {
        readonly total: Histogram;
        readonly error: Counter;
      };
    },
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor
      .at('local_user_account_provider')
      .withLabels(labels)
      .captureSpanLog(func, {
        name,
        metric,
        level: { log: 'verbose', span: 'info' },
        trace: true,
      });
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
