import {
  assertTransactionType,
  common,
  ECPoint,
  hasFlag,
  IOHelper,
  JSONHelper,
  MAX_TRANSACTION_ATTRIBUTES,
  TransactionBaseJSON,
  TransactionBaseModel,
  TransactionBaseModelAdd,
  TransactionBaseModelAddWithType,
  UInt160,
  UInt160Hex,
} from '@neo-one/client-common';
import { utils as commonUtils } from '@neo-one/utils';
import BN from 'bn.js';
import _ from 'lodash';
import { Account, AccountKey } from '../Account';
import { Asset, AssetKey } from '../Asset';
import { AssetType } from '../AssetType';
import { MAX_TRANSACTION_SIZE } from '../constants';
import { Equals, EquatableKey } from '../Equatable';
import { VerifyError } from '../errors';
import { ScriptContainerType } from '../ScriptContainer';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { Validator } from '../Validator';
import { VerifyScript, VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute, AttributeUsage, deserializeAttributeWireBase, UInt160Attribute } from './attribute';
import { hasDuplicateInputs, hasIntersectingInputs } from './common';
import { Input } from './Input';
import { Output, OutputKey } from './Output';
import { RegisterTransaction } from './RegisterTransaction';
import { Transaction } from './Transaction';
import { TransactionType } from './TransactionType';

export interface TransactionBaseAdd extends TransactionBaseModelAdd<Attribute, Input, Output, Witness> {}
export interface TransactionBaseAddWithType<Type extends TransactionType>
  extends TransactionBaseModelAddWithType<Type, Attribute, Input, Output, Witness> {}

const getUtilityValue = ({
  outputs,
  utilityToken,
}: {
  readonly outputs: readonly Output[];
  readonly utilityToken: RegisterTransaction;
}) =>
  outputs
    .filter((output) => common.uInt256Equal(output.asset, utilityToken.hash))
    .reduce((acc, output) => acc.add(output.value), utils.ZERO);

export interface FeeContext {
  readonly getOutput: (input: Input) => Promise<Output>;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
}

export interface TransactionGetScriptHashesForVerifyingOptions {
  readonly getOutput: (key: OutputKey) => Promise<Output>;
  readonly getAsset: (key: AssetKey) => Promise<Asset>;
}

export interface GetReferencesOptions {
  readonly getOutput: (key: OutputKey) => Promise<Output>;
}

export interface GetTransactionResultsOptions {
  readonly getOutput: (key: OutputKey) => Promise<Output>;
}

export interface TransactionVerifyOptions {
  readonly calculateClaimAmount: (inputs: readonly Input[]) => Promise<BN>;
  readonly isSpent: (key: OutputKey) => Promise<boolean>;
  readonly getAsset: (key: AssetKey) => Promise<Asset>;
  readonly getOutput: (key: OutputKey) => Promise<Output>;
  readonly tryGetAccount: (key: AccountKey) => Promise<Account | undefined>;
  readonly standbyValidators: readonly ECPoint[];
  readonly getAllValidators: () => Promise<readonly Validator[]>;
  readonly verifyScript: VerifyScript;
  readonly currentHeight: number;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
  readonly memPool?: readonly Transaction[];
}

/** @internal */
export function TransactionBase<
  Type extends TransactionType,
  TransactionJSON,
  TBase extends Constructor<TransactionBaseModel<Type, Attribute, Input, Output, Witness>>
>(Base: TBase) {
  abstract class TransactionBaseClass extends Base implements EquatableKey, SerializableJSON<TransactionJSON> {
    public static deserializeTransactionBaseStartWireBase({
      reader,
    }: DeserializeWireBaseOptions): { readonly type: TransactionType; readonly version: number } {
      const type = assertTransactionType(reader.readUInt8());
      const version = reader.readUInt8();

      return { type, version };
    }

    public static deserializeTransactionBaseEndWireBase(
      options: DeserializeWireBaseOptions,
    ): {
      readonly attributes: readonly Attribute[];
      readonly inputs: readonly Input[];
      readonly outputs: readonly Output[];
      readonly scripts: readonly Witness[];
    } {
      const { reader } = options;
      const attributes = reader.readArray(() => deserializeAttributeWireBase(options), MAX_TRANSACTION_ATTRIBUTES);

      const inputs = reader.readArray(() => Input.deserializeWireBase(options));
      const outputs = reader.readArray(() => Output.deserializeWireBase(options), utils.USHORT_MAX_NUMBER + 1);

      const scripts = reader.readArray(() => Witness.deserializeWireBase(options));

      return { attributes, inputs, outputs, scripts };
    }

    // tslint:disable-next-line no-any
    public static deserializeWireBase(_options: DeserializeWireBaseOptions): any {
      throw new Error('Not Implemented');
    }

    // tslint:disable-next-line no-any
    public static deserializeWire(options: DeserializeWireOptions): any {
      return this.deserializeWireBase({
        context: options.context,
        reader: new BinaryReader(options.buffer),
      });
    }

    protected static readonly WitnessConstructor: Constructor<Witness> = Witness;

    public readonly equals: Equals = utils.equals(
      // tslint:disable-next-line no-any
      this.constructor as any,
      this,
      (other: TransactionBaseClass) => common.uInt256Equal(this.hash, other.hash),
    );
    public readonly toKeyString = utils.toKeyString(TransactionBase, () => this.hashHex);
    public readonly getSortedScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await this.getScriptHashesForVerifying(options);

        // tslint:disable-next-line no-array-mutation
        return [...hashes].sort();
      },
    );
    private readonly sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfArray(this.attributes, (attribute) => attribute.size) +
        IOHelper.sizeOfArray(this.inputs, (input) => input.size) +
        IOHelper.sizeOfArray(this.outputs, (output) => output.size) +
        IOHelper.sizeOfArray(this.scripts, (script) => script.size) +
        this.sizeExclusive(),
    );
    private readonly networkFee = utils.lazyAsync(
      async (context: FeeContext): Promise<BN> => {
        const { getOutput, utilityToken } = context;

        const outputsForInputs = await Promise.all(this.inputs.map(getOutput));

        const inputValue = getUtilityValue({
          outputs: outputsForInputs,
          utilityToken,
        });

        const outputValue = getUtilityValue({
          outputs: this.outputs,
          utilityToken,
        });

        const result = inputValue.sub(outputValue).sub(this.getSystemFee(context));

        return result.lt(utils.ZERO) ? utils.ZERO : result;
      },
    );
    private readonly getReferencesInternal = utils.lazyAsync(async ({ getOutput }: GetReferencesOptions) =>
      Promise.all(this.inputs.map(async (input) => getOutput(input))),
    );
    private readonly getTransactionResultsInternal = utils.lazyAsync(
      async ({ getOutput }: GetTransactionResultsOptions): Promise<{ readonly [K in string]?: BN }> => {
        const inputOutputs = await this.getReferences({ getOutput });
        const mutableResults: { [K in string]?: BN } = {};
        const addOutputs = (outputs: readonly Output[], negative?: boolean) => {
          outputs.forEach((output) => {
            const key = common.uInt256ToHex(output.asset);
            let result = mutableResults[key];
            if (result === undefined) {
              mutableResults[key] = result = utils.ZERO;
            }

            mutableResults[key] = result.add(negative === true ? output.value.neg() : output.value);
          });
        };
        addOutputs(inputOutputs);
        addOutputs(this.outputs, true);

        return _.pickBy(mutableResults, (value) => value !== undefined && !value.eq(utils.ZERO));
      },
    );
    private readonly baseGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async ({ getOutput, getAsset }: TransactionGetScriptHashesForVerifyingOptions) => {
        const [inputHashes, outputHashes] = await Promise.all([
          Promise.all(
            this.inputs.map(async (input) => {
              const output = await getOutput(input);

              return common.uInt160ToHex(output.address);
            }),
          ),

          Promise.all(
            this.outputs.map(async (output) => {
              const asset = await getAsset({ hash: output.asset });
              if (hasFlag(asset.type, AssetType.DutyFlag)) {
                return common.uInt160ToHex(output.address);
              }

              return undefined;
            }),
          ).then((hashes) => hashes.filter(commonUtils.notNull)),
        ]);

        const attributeHashes = this.attributes
          .map((attribute) =>
            attribute instanceof UInt160Attribute && attribute.usage === AttributeUsage.Script
              ? common.uInt160ToHex(attribute.value)
              : undefined,
          )
          .filter(commonUtils.notNull);

        return new Set([...inputHashes, ...outputHashes, ...attributeHashes]);
      },
    );

    public get size(): number {
      return this.sizeInternal();
    }

    public async serializeTransactionBaseJSON(context: SerializeJSONContext): Promise<TransactionBaseJSON> {
      const [networkFee, transactionData] = await Promise.all([
        this.getNetworkFee(context.feeContext),
        // tslint:disable-next-line no-any
        context.tryGetTransactionData(this as any),
      ]);

      return {
        txid: common.uInt256ToString(this.hashHex),
        size: this.size,
        version: this.version,
        attributes: this.attributes.map((attribute) => attribute.serializeJSON(context)),

        vin: this.inputs.map((input) => input.serializeJSON(context)),
        vout: this.outputs.map((output, index) => output.serializeJSON(context, index)),

        scripts: this.scripts.map((script) => script.serializeJSON(context)),
        sys_fee: JSONHelper.writeFixed8(this.getSystemFee(context.feeContext)),
        net_fee: JSONHelper.writeFixed8(networkFee),
        data:
          transactionData === undefined
            ? undefined
            : {
                blockHash: common.uInt256ToString(transactionData.blockHash),
                blockIndex: transactionData.startHeight,
                transactionIndex: transactionData.index,
                globalIndex: JSONHelper.writeUInt64(transactionData.globalIndex),
              },
      };
    }

    public async serializeJSON(_context: SerializeJSONContext): Promise<TransactionJSON> {
      throw new Error('Not Implemented');
    }

    public async getNetworkFee(context: FeeContext): Promise<BN> {
      return this.networkFee(context);
    }

    public getSystemFee({ fees }: FeeContext): BN {
      const fee: BN | undefined = fees[this.type];

      return fee === undefined ? utils.ZERO : fee;
    }

    public async getReferences(options: GetReferencesOptions): Promise<readonly Output[]> {
      return this.getReferencesInternal(options);
    }

    public async getTransactionResults(options: GetTransactionResultsOptions): Promise<{ readonly [key: string]: BN }> {
      return this.getTransactionResultsInternal(options) as Promise<{ readonly [key: string]: BN }>;
    }

    public async getScriptHashesForVerifying(
      options: TransactionGetScriptHashesForVerifyingOptions,
    ): Promise<Set<UInt160Hex>> {
      return this.baseGetScriptHashesForVerifyingInternal(options);
    }

    public async verify(options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
      if (this.size > MAX_TRANSACTION_SIZE) {
        throw new VerifyError('Transaction too large.');
      }

      const { memPool = [] } = options;
      if (hasDuplicateInputs(this.inputs)) {
        throw new VerifyError('Duplicate inputs');
      }

      if (memPool.some((tx) => !tx.equals(this) && hasIntersectingInputs(tx.inputs, this.inputs))) {
        throw new VerifyError('Input already exists in mempool');
      }

      if (
        this.attributes.filter(
          (attribute) => attribute.usage === AttributeUsage.ECDH02 || attribute.usage === AttributeUsage.ECDH03,
        ).length > 1
      ) {
        throw new VerifyError('Too many ECDH attributes.');
      }

      const [results] = await Promise.all([
        this.verifyScripts(options),
        this.verifyDoubleSpend(options),
        this.verifyOutputs(options),
        this.verifyTransactionResults(options),
      ]);

      return results;
    }

    protected readonly sizeExclusive: () => number = () => 0;

    private async verifyDoubleSpend({ isSpent }: TransactionVerifyOptions): Promise<void> {
      const isDoubleSpend = await Promise.all(this.inputs.map(isSpent));

      if (isDoubleSpend.some((value) => value)) {
        throw new VerifyError('Transaction is a double spend');
      }
    }

    private async verifyOutputs({ getAsset, currentHeight }: TransactionVerifyOptions): Promise<void> {
      const outputsGrouped = Object.entries(_.groupBy(this.outputs, (output) => common.uInt256ToHex(output.asset)));

      const hasInvalidOutputs = await Promise.all(
        outputsGrouped.map(async ([assetHex, outputs]) => {
          const asset = await getAsset({ hash: common.hexToUInt256(assetHex) });
          if (
            asset.expiration <= currentHeight + 1 &&
            asset.type !== AssetType.GoverningToken &&
            asset.type !== AssetType.UtilityToken
          ) {
            return true;
          }

          return outputs.some(
            (output) => !output.value.mod(utils.TEN.pow(utils.EIGHT.subn(asset.precision))).eq(utils.ZERO),
          );
        }),
      );

      if (hasInvalidOutputs.some((value) => value)) {
        throw new VerifyError('Transaction has invalid output');
      }
    }

    private async verifyTransactionResults({
      getOutput,
      utilityToken,
      governingToken,
      fees,
      registerValidatorFee,
    }: TransactionVerifyOptions): Promise<void> {
      const results = await this.getTransactionResults({ getOutput });
      const resultsDestroy = Object.entries(results).filter(
        // tslint:disable-next-line no-unused
        ([_key, value]) => value.gt(utils.ZERO),
      );

      if (
        resultsDestroy.length > 1 ||
        (resultsDestroy.length === 1 &&
          !common.uInt256Equal(common.hexToUInt256(resultsDestroy[0][0]), utilityToken.hash))
      ) {
        throw new VerifyError('Invalid destroyed output.');
      }

      const feeContext = {
        getOutput,
        governingToken,
        utilityToken,
        fees,
        registerValidatorFee,
      };

      const systemFee = this.getSystemFee(feeContext);
      if (systemFee.gt(utils.ZERO) && (resultsDestroy.length === 0 || resultsDestroy[0][1].lt(systemFee))) {
        throw new VerifyError('Not enough output value for system fee.');
      }

      // tslint:disable-next-line no-unused
      const resultsIssue = Object.entries(results).filter(([__, value]) => value.lt(utils.ZERO));

      switch (this.type) {
        case TransactionType.Miner:
        case TransactionType.Claim:
          if (
            resultsIssue.some(([assetHex]) => !common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))
          ) {
            throw new VerifyError('Invalid miner/claim result');
          }
          break;
        case TransactionType.Issue:
          if (
            // tslint:disable-next-line no-unused
            resultsIssue.some(([assetHex, __]) => common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))
          ) {
            throw new VerifyError('Invalid issue result');
          }
          break;
        default:
          if (resultsIssue.length > 0) {
            throw new VerifyError('Invalid results.');
          }
      }
    }

    private async verifyScripts({
      getAsset,
      getOutput,
      verifyScript,
    }: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
      const hashesArr = await this.getSortedScriptHashesForVerifying({
        getAsset,
        getOutput,
      });

      if (hashesArr.length !== this.scripts.length) {
        throw new VerifyError(
          `Invalid witnesses. Found ${hashesArr.length} hashes and ${this.scripts.length} scripts.`,
        );
      }

      const hashes = hashesArr.map((value) => common.hexToUInt160(value));

      return Promise.all(
        _.zip(hashes, this.scripts).map(async ([hash, witness]) =>
          verifyScript({
            scriptContainer: {
              type: ScriptContainerType.Transaction,
              // tslint:disable-next-line no-any
              value: this as any,
            },
            hash: hash as UInt160,
            witness: witness as Witness,
          }),
        ),
      );
    }
  }

  return TransactionBaseClass;
}
