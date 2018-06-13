import { utils as commonUtils } from '@neo-one/utils';
import BN from 'bn.js';
import _ from 'lodash';
import { Account, AccountKey } from '../Account';
import { Asset, AssetKey } from '../Asset';
import { AssetType, hasFlag } from '../AssetType';
import {
  common,
  ECPoint,
  PrivateKey,
  UInt160,
  UInt160Hex,
  UInt256,
  UInt256Hex,
} from '../common';
import { crypto } from '../crypto';
import { Equals, Equatable } from '../Equatable';
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
import {
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
  utils,
} from '../utils';
import { Validator } from '../Validator';
import { VerifyScript } from '../vm';
import { Witness, WitnessJSON } from '../Witness';
import {
  Attribute,
  AttributeJSON,
  AttributeUsage,
  deserializeAttributeWireBase,
  UInt160Attribute,
} from './attribute';
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
  outputs: Output[];
  utilityToken: RegisterTransaction;
}) =>
  outputs
    .filter((output) => common.uInt256Equal(output.asset, utilityToken.hash))
    .reduce((acc, output) => acc.add(output.value), utils.ZERO);

export interface FeeContext {
  getOutput: (input: Input) => Promise<Output>;
  governingToken: RegisterTransaction;
  utilityToken: RegisterTransaction;
  fees: { [K in TransactionType]?: BN };
  registerValidatorFee: BN;
}

export interface TransactionGetScriptHashesForVerifyingOptions {
  getOutput: (key: OutputKey) => Promise<Output>;
  getAsset: (key: AssetKey) => Promise<Asset>;
}

export interface GetReferencesOptions {
  getOutput: (key: OutputKey) => Promise<Output>;
}

export interface GetTransactionResultsOptions {
  getOutput: (key: OutputKey) => Promise<Output>;
}

export interface TransactionVerifyOptions {
  calculateClaimAmount: (inputs: Input[]) => Promise<BN>;
  isSpent: (key: OutputKey) => Promise<boolean>;
  getAsset: (key: AssetKey) => Promise<Asset>;
  getOutput: (key: OutputKey) => Promise<Output>;
  tryGetAccount: (key: AccountKey) => Promise<Account | null>;
  standbyValidators: ECPoint[];
  getAllValidators: () => Promise<Validator[]>;
  verifyScript: VerifyScript;
  currentHeight: number;
  governingToken: RegisterTransaction;
  utilityToken: RegisterTransaction;
  fees: { [K in TransactionType]?: BN };
  registerValidatorFee: BN;
  memPool?: Transaction[];
}

export interface TransactionBaseAdd {
  version?: number;
  attributes?: Attribute[];
  inputs?: Input[];
  outputs?: Output[];
  scripts?: Witness[];
  hash?: UInt256;
}

export interface TransactionBaseAddWithType<Type extends TransactionType>
  extends TransactionBaseAdd {
  type: Type;
}

export interface TransactionBaseJSON {
  txid: string;
  size: number;
  version: number;
  attributes: AttributeJSON[];
  vin: InputJSON[];
  vout: OutputJSON[];
  scripts: WitnessJSON[];
  sys_fee: string;
  net_fee: string;
  data: {
    blockHash: string;
    blockIndex: number;
    index: number;
    globalIndex: string;
  } | null;
}

export const MAX_TRANSACTION_ATTRIBUTES = 16;

export abstract class TransactionBase<
  Type extends TransactionType,
  TransactionJSON
>
  implements
    Equatable,
    SerializableWire<Transaction>,
    SerializableJSON<TransactionJSON> {
  public static readonly VERSION: number;
  public static deserializeTransactionBaseStartWireBase({
    reader,
  }: DeserializeWireBaseOptions): { type: TransactionType; version: number } {
    const type = assertTransactionType(reader.readUInt8());
    const version = reader.readUInt8();

    return { type, version };
  }

  public static deserializeTransactionBaseEndWireBase(
    options: DeserializeWireBaseOptions,
  ): {
    attributes: Attribute[];
    inputs: Input[];
    outputs: Output[];
    scripts: Witness[];
  } {
    const { reader } = options;
    const attributes = reader.readArray(
      () => deserializeAttributeWireBase(options),
      MAX_TRANSACTION_ATTRIBUTES,
    );

    const inputs = reader.readArray(() => Input.deserializeWireBase(options));
    const outputs = reader.readArray(
      () => Output.deserializeWireBase(options),
      utils.USHORT_MAX_NUMBER + 1,
    );

    const scripts = reader.readArray(() =>
      Witness.deserializeWireBase(options),
    );

    return { attributes, inputs, outputs, scripts };
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): any {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): any {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: Type;
  public readonly version: number;
  public readonly attributes: Attribute[];
  public readonly inputs: Input[];
  public readonly outputs: Output[];
  public readonly scripts: Witness[];
  public readonly equals: Equals = utils.equals(
    this.constructor as any,
    (other: TransactionBase<Type, TransactionJSON>) =>
      common.uInt256Equal(this.hash, other.hash),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(
    this.serializeUnsignedBase.bind(this),
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
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() =>
    common.uInt256ToHex(this.hash),
  );
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());
  private readonly networkFee = utils.lazyAsync(
    async (context: FeeContext): Promise<BN> => {
      const { getOutput, utilityToken } = context;

      const outputsForInputs = await Promise.all(
        this.inputs.map((input) => getOutput(input)),
      );

      const inputValue = getUtilityValue({
        outputs: outputsForInputs,
        utilityToken,
      });

      const outputValue = getUtilityValue({
        outputs: this.outputs,
        utilityToken,
      });

      const result = inputValue
        .sub(outputValue)
        .sub(this.getSystemFee(context));
      return result.lt(utils.ZERO) ? utils.ZERO : result;
    },
  );
  private readonly getReferencesInternal = utils.lazyAsync(
    async ({ getOutput }: GetReferencesOptions) =>
      Promise.all(this.inputs.map((input) => getOutput(input))),
  );
  private readonly getTransactionResultsInternal = utils.lazyAsync(
    async ({
      getOutput,
    }: GetTransactionResultsOptions): Promise<{ [asset: string]: BN }> => {
      const inputOutputs = await this.getReferences({ getOutput });
      const results = {} as { [asset: string]: BN };
      const addOutputs = (outputs: Output[], negative?: boolean) => {
        for (const output of outputs) {
          const key = common.uInt256ToHex(output.asset);
          if (results[key] == null) {
            results[key] = utils.ZERO;
          }

          results[key] = results[key].add(
            negative ? output.value.neg() : output.value,
          );
        }
      };
      addOutputs(inputOutputs);
      addOutputs(this.outputs, true);

      return _.pickBy(results, (value) => !value.eq(utils.ZERO)) as {
        [asset: string]: BN;
      };
    },
  );
  private readonly baseGetScriptHashesForVerifyingInternal = utils.lazyAsync(
    async ({
      getOutput,
      getAsset,
    }: TransactionGetScriptHashesForVerifyingOptions) => {
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

            return null;
          }),
        ).then((hashes) => hashes.filter(commonUtils.notNull)),
      ]);

      const attributeHashes = this.attributes
        .map(
          (attribute) =>
            attribute instanceof UInt160Attribute &&
            attribute.usage === AttributeUsage.Script
              ? common.uInt160ToHex(attribute.value)
              : null,
        )
        .filter(commonUtils.notNull);

      return new Set([...inputHashes, ...outputHashes, ...attributeHashes]);
    },
  );

  constructor({
    version,
    type,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
  }: TransactionBaseAddWithType<Type>) {
    // workaround: babel fails to transpile if we have
    // static VERSION: number = 0;
    this.version =
      version == null
        ? (this.constructor as typeof TransactionBase).VERSION || 0
        : version;
    this.type = type;
    this.attributes = attributes || [];
    this.inputs = inputs || [];
    this.outputs = outputs || [];
    this.scripts = scripts || [];
    const hashIn = hash;
    this.hashInternal =
      hashIn == null
        ? utils.lazy(() => crypto.hash256(this.message))
        : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError();
    }
  }

  public abstract clone(options: {
    scripts?: Witness[];
    attributes?: Attribute[];
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
      scripts: this.scripts.concat([
        crypto.createWitness(this.serializeUnsigned(), key),
      ]),
    });
  }

  public signWithSignature(
    signature: Buffer,
    publicKey: ECPoint,
  ): TransactionBase<Type, TransactionJSON> {
    return this.clone({
      scripts: this.scripts.concat([
        crypto.createWitnessForSignature(signature, publicKey),
      ]),
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
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

  public async serializeTransactionBaseJSON(
    context: SerializeJSONContext,
  ): Promise<TransactionBaseJSON> {
    const [networkFee, transactionData] = await Promise.all([
      this.getNetworkFee(context.feeContext),
      context.tryGetTransactionData(this),
    ]);

    return {
      txid: common.uInt256ToString(this.hashHex),
      size: this.size,
      version: this.version,
      attributes: this.attributes.map((attribute) =>
        attribute.serializeJSON(context),
      ),

      vin: this.inputs.map((input) => input.serializeJSON(context)),
      vout: this.outputs.map((output, index) =>
        output.serializeJSON(context, index),
      ),

      scripts: this.scripts.map((script) => script.serializeJSON(context)),
      sys_fee: JSONHelper.writeFixed8(this.getSystemFee(context.feeContext)),
      net_fee: JSONHelper.writeFixed8(networkFee),
      data:
        transactionData == null
          ? null
          : {
              blockHash: common.uInt256ToString(transactionData.blockHash),
              blockIndex: transactionData.startHeight,
              index: transactionData.index,
              globalIndex: JSONHelper.writeUInt64(transactionData.globalIndex),
            },
    };
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<TransactionJSON> {
    throw new Error('Not Implemented');
  }

  public async getNetworkFee(context: FeeContext): Promise<BN> {
    return this.networkFee(context);
  }

  public getSystemFee({ fees }: FeeContext): BN {
    const fee: BN | undefined = fees[this.type];
    return fee || utils.ZERO;
  }

  public getReferences(options: GetReferencesOptions): Promise<Output[]> {
    return this.getReferencesInternal(options);
  }

  public getTransactionResults(
    options: GetTransactionResultsOptions,
  ): Promise<{ [asset: string]: BN }> {
    return this.getTransactionResultsInternal(options);
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
        (tx) =>
          !tx.equals(this) &&
          tx.inputs.some((input) =>
            this.inputs.some((thisInput) => input.equals(thisInput)),
          ),
      )
    ) {
      throw new VerifyError('Input already exists in mempool');
    }

    if (
      this.attributes.filter(
        (attribute) =>
          attribute.usage === AttributeUsage.ECDH02 ||
          attribute.usage === AttributeUsage.ECDH03,
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

  private async verifyDoubleSpend({
    isSpent,
  }: TransactionVerifyOptions): Promise<void> {
    const isDoubleSpend = await Promise.all(
      this.inputs.map((input) => isSpent(input)),
    );

    if (isDoubleSpend.some((value) => value)) {
      throw new VerifyError('Transaction is a double spend');
    }
  }

  private async verifyOutputs({
    getAsset,
    currentHeight,
  }: TransactionVerifyOptions): Promise<void> {
    const outputsGrouped = Object.entries(
      _.groupBy(this.outputs, (output) => common.uInt256ToHex(output.asset)),
    );

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
          (output) =>
            !output.value
              .mod(utils.TEN.pow(utils.EIGHT.subn(asset.precision)))
              .eq(utils.ZERO),
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
    const resultsDestroy = Object.entries(results).filter(([__, value]) =>
      value.gt(utils.ZERO),
    );

    if (
      resultsDestroy.length > 1 ||
      (resultsDestroy.length === 1 &&
        !common.uInt256Equal(
          common.hexToUInt256(resultsDestroy[0][0]),
          utilityToken.hash,
        ))
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
    if (
      systemFee.gt(utils.ZERO) &&
      (resultsDestroy.length === 0 || resultsDestroy[0][1].lt(systemFee))
    ) {
      throw new VerifyError('Not enough output value for system fee.');
    }

    const resultsIssue = Object.entries(results).filter(([__, value]) =>
      value.lt(utils.ZERO),
    );

    switch (this.type) {
      case TransactionType.Miner:
      case TransactionType.Claim:
        if (
          resultsIssue.some(
            ([assetHex, __]) =>
              !common.uInt256Equal(
                common.hexToUInt256(assetHex),
                utilityToken.hash,
              ),
          )
        ) {
          throw new VerifyError('Invalid miner/claim result');
        }
        break;
      case TransactionType.Issue:
        if (
          resultsIssue.some(([assetHex, __]) =>
            common.uInt256Equal(
              common.hexToUInt256(assetHex),
              utilityToken.hash,
            ),
          )
        ) {
          throw new VerifyError('Invalid issue result');
        }
        break;
      default:
        if (resultsIssue.length > 0) {
          throw new VerifyError('Invalid results.');
        }
        break;
    }
  }

  private async verifyScripts({
    getAsset,
    getOutput,
    verifyScript,
  }: TransactionVerifyOptions): Promise<void> {
    const hashesSet = await this.getScriptHashesForVerifying({
      getAsset,
      getOutput,
    });

    if (hashesSet.size !== this.scripts.length) {
      throw new VerifyError('Invalid witnesses');
    }

    const hashes = [...hashesSet]
      .sort()
      .map((value) => common.hexToUInt160(value));
    await Promise.all(
      _.zip(hashes, this.scripts).map(([hash, witness]) =>
        verifyScript({
          scriptContainer: {
            type: ScriptContainerType.Transaction,
            value: this as any,
          },
          hash: hash as UInt160,
          witness: witness as Witness,
        }),
      ),
    );
  }
}
