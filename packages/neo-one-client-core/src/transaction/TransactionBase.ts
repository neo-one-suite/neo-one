import { utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import _ from 'lodash';
import { Account, AccountKey } from '../Account';
import { Asset, AssetKey } from '../Asset';
import { AssetType, hasFlag } from '../AssetType';
import { common, ECPoint, PrivateKey, UInt160, UInt160Hex, UInt256, UInt256Hex } from '../common';
import { crypto } from '../crypto';
import { Equals, EquatableKey } from '../Equatable';
import { InvalidFormatError, VerifyError } from '../errors';
import { ScriptContainerType } from '../ScriptContainer';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';
import { Validator } from '../Validator';
import { VerifyScript } from '../vm';
import { Witness, WitnessJSON } from '../Witness';
import { Attribute, AttributeJSON, AttributeUsage, deserializeAttributeWireBase, UInt160Attribute } from './attribute';
import { hasDuplicateInputs } from './common';
import { Input, InputJSON } from './Input';
import { Output, OutputJSON, OutputKey } from './Output';
import { RegisterTransaction } from './RegisterTransaction';
import { Transaction } from './Transaction';
import { assertTransactionType, TransactionType } from './TransactionType';

const getUtilityValue = ({
  outputs,
  utilityToken,
}: {
  readonly outputs: ReadonlyArray<Output>;
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
  readonly calculateClaimAmount: (inputs: ReadonlyArray<Input>) => Promise<BN>;
  readonly isSpent: (key: OutputKey) => Promise<boolean>;
  readonly getAsset: (key: AssetKey) => Promise<Asset>;
  readonly getOutput: (key: OutputKey) => Promise<Output>;
  readonly tryGetAccount: (key: AccountKey) => Promise<Account | undefined>;
  readonly standbyValidators: ReadonlyArray<ECPoint>;
  readonly getAllValidators: () => Promise<ReadonlyArray<Validator>>;
  readonly verifyScript: VerifyScript;
  readonly currentHeight: number;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
  readonly memPool?: ReadonlyArray<Transaction>;
}

export interface TransactionBaseAdd {
  readonly version?: number;
  readonly attributes?: ReadonlyArray<Attribute>;
  readonly inputs?: ReadonlyArray<Input>;
  readonly outputs?: ReadonlyArray<Output>;
  readonly scripts?: ReadonlyArray<Witness>;
  readonly hash?: UInt256;
}

export interface TransactionBaseAddWithType<Type extends TransactionType> extends TransactionBaseAdd {
  readonly type: Type;
}

export interface TransactionBaseJSON {
  readonly txid: string;
  readonly size: number;
  readonly version: number;
  readonly attributes: ReadonlyArray<AttributeJSON>;
  readonly vin: ReadonlyArray<InputJSON>;
  readonly vout: ReadonlyArray<OutputJSON>;
  readonly scripts: ReadonlyArray<WitnessJSON>;
  readonly sys_fee: string;
  readonly net_fee: string;
  readonly data:
    | {
        readonly blockHash: string;
        readonly blockIndex: number;
        readonly index: number;
        readonly globalIndex: string;
      }
    | undefined;
}

export const MAX_TRANSACTION_ATTRIBUTES = 16;

export abstract class TransactionBase<
  Type extends TransactionType = TransactionType,
  TransactionJSON = TransactionBaseJSON
> implements EquatableKey, SerializableWire<Transaction>, SerializableJSON<TransactionJSON> {
  public static readonly VERSION: number = 0;
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
    readonly attributes: ReadonlyArray<Attribute>;
    readonly inputs: ReadonlyArray<Input>;
    readonly outputs: ReadonlyArray<Output>;
    readonly scripts: ReadonlyArray<Witness>;
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

  public readonly type: Type;
  public readonly version: number;
  public readonly attributes: ReadonlyArray<Attribute>;
  public readonly inputs: ReadonlyArray<Input>;
  public readonly outputs: ReadonlyArray<Output>;
  public readonly scripts: ReadonlyArray<Witness>;
  public readonly equals: Equals = utils.equals(
    // tslint:disable-next-line no-any
    this.constructor as any,
    this,
    (other: TransactionBase<Type, TransactionJSON>) => common.uInt256Equal(this.hash, other.hash),
  );
  public readonly toKeyString = utils.toKeyString(TransactionBase, () => this.hashHex);
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase.bind(this));
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfArray(this.attributes, (attribute) => attribute.size) +
      IOHelper.sizeOfArray(this.inputs, (input) => input.size) +
      IOHelper.sizeOfArray(this.outputs, (output) => output.size) +
      IOHelper.sizeOfArray(this.scripts, (script) => script.size) +
      this.sizeExclusive(),
  );
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());
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
      const addOutputs = (outputs: ReadonlyArray<Output>, negative?: boolean) => {
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
        .map(
          (attribute) =>
            attribute instanceof UInt160Attribute && attribute.usage === AttributeUsage.Script
              ? common.uInt160ToHex(attribute.value)
              : undefined,
        )
        .filter(commonUtils.notNull);

      return new Set([...inputHashes, ...outputHashes, ...attributeHashes]);
    },
  );

  public constructor({
    version,
    type,
    attributes = [],
    inputs = [],
    outputs = [],
    scripts = [],
    hash,
  }: TransactionBaseAddWithType<Type>) {
    // workaround: babel fails to transpile if we have
    // static VERSION: number = 0;
    this.version = version === undefined ? (this.constructor as typeof TransactionBase).VERSION : version;
    this.type = type;
    this.attributes = attributes;
    this.inputs = inputs;
    this.outputs = outputs;
    this.scripts = scripts;
    const hashIn = hash;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError();
    }
  }

  public abstract clone(options: {
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
  }): TransactionBase<Type, TransactionJSON>;

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public sign(key: PrivateKey): TransactionBase<Type, TransactionJSON> {
    return this.clone({
      scripts: this.scripts.concat([crypto.createWitness(this.serializeUnsigned(), key)]),
    });
  }

  public signWithSignature(signature: Buffer, publicKey: ECPoint): TransactionBase<Type, TransactionJSON> {
    return this.clone({
      scripts: this.scripts.concat([crypto.createWitnessForSignature(signature, publicKey)]),
    });
  }

  public serializeExclusiveBase(_writer: BinaryWriter): void {
    // do nothing
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    this.serializeExclusiveBase(writer);
    writer.writeArray(this.attributes, (attribute) => {
      attribute.serializeWireBase(writer);
    });
    writer.writeArray(this.inputs, (input) => {
      input.serializeWireBase(writer);
    });
    writer.writeArray(this.outputs, (output) => {
      output.serializeWireBase(writer);
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeArray(this.scripts, (script) => {
      script.serializeWireBase(writer);
    });
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
              index: transactionData.index,
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

  public async getReferences(options: GetReferencesOptions): Promise<ReadonlyArray<Output>> {
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

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    const { memPool = [] } = options;
    if (hasDuplicateInputs(this.inputs)) {
      throw new VerifyError('Duplicate inputs');
    }

    if (
      memPool.some(
        (tx) => !tx.equals(this) && tx.inputs.some((input) => this.inputs.some((thisInput) => input.equals(thisInput))),
      )
    ) {
      throw new VerifyError('Input already exists in mempool');
    }

    if (
      this.attributes.filter(
        (attribute) => attribute.usage === AttributeUsage.ECDH02 || attribute.usage === AttributeUsage.ECDH03,
      ).length > 1
    ) {
      throw new VerifyError('Too many ECDH attributes.');
    }

    await Promise.all([
      this.verifyDoubleSpend(options),
      this.verifyOutputs(options),
      this.verifyTransactionResults(options),
      this.verifyScripts(options),
    ]);
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
          // tslint:disable-next-line no-unused
          resultsIssue.some(([assetHex, __]) => !common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))
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

  private async verifyScripts({ getAsset, getOutput, verifyScript }: TransactionVerifyOptions): Promise<void> {
    const hashesSet = await this.getScriptHashesForVerifying({
      getAsset,
      getOutput,
    });

    if (hashesSet.size !== this.scripts.length) {
      throw new VerifyError('Invalid witnesses');
    }

    // tslint:disable-next-line no-array-mutation
    const hashes = [...hashesSet].sort().map((value) => common.hexToUInt160(value));
    await Promise.all(
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
