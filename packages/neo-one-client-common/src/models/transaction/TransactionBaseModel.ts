import { BinaryWriter } from '../../BinaryWriter';
import { common, ECPoint, InvalidFormatError, PrivateKey, UInt256, UInt256Hex } from '../../common';
import { crypto } from '../../crypto';
import { utils } from '../../utils';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';
import { InputModel } from './InputModel';
import { OutputModel } from './OutputModel';
import { TransactionTypeModel } from './TransactionTypeModel';

export interface TransactionBaseModelAdd<
  TAttribute extends AttributeModel,
  TInput extends InputModel,
  TOutput extends OutputModel,
  TWitness extends WitnessModel
> {
  readonly version?: number;
  readonly attributes?: readonly TAttribute[];
  readonly inputs?: readonly TInput[];
  readonly outputs?: readonly TOutput[];
  readonly scripts?: readonly TWitness[];
  readonly hash?: UInt256;
}

export interface TransactionBaseModelAddWithType<
  Type extends TransactionTypeModel,
  TAttribute extends AttributeModel,
  TInput extends InputModel,
  TOutput extends OutputModel,
  TWitness extends WitnessModel
> extends TransactionBaseModelAdd<TAttribute, TInput, TOutput, TWitness> {
  readonly type: Type;
}

export const MAX_TRANSACTION_ATTRIBUTES = 16;

export abstract class TransactionBaseModel<
  Type extends TransactionTypeModel = TransactionTypeModel,
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> implements SerializableWire<TransactionBaseModel> {
  public static readonly VERSION: number = 0;
  protected static readonly WitnessConstructor: Constructor<WitnessModel> = WitnessModel;

  public readonly type: Type;
  public readonly version: number;
  public readonly attributes: readonly TAttribute[];
  public readonly inputs: readonly TInput[];
  public readonly outputs: readonly TOutput[];
  public readonly scripts: readonly TWitness[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase.bind(this));
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());

  public constructor({
    version,
    type,
    attributes = [],
    inputs = [],
    outputs = [],
    scripts = [],
    hash,
  }: TransactionBaseModelAddWithType<Type, TAttribute, TInput, TOutput, TWitness>) {
    // workaround: babel fails to transpile if we have
    // static VERSION: number = 0;
    this.version = version === undefined ? (this.constructor as typeof TransactionBaseModel).VERSION : version;
    this.type = type;
    this.attributes = attributes;
    this.inputs = inputs;
    this.outputs = outputs;
    this.scripts = scripts;
    const hashIn = hash;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError(
        `Expected less than ${MAX_TRANSACTION_ATTRIBUTES} attributes, found: ${attributes.length}`,
      );
    }
  }

  public abstract clone(options: {
    readonly scripts?: readonly TWitness[];
    readonly attributes?: readonly TAttribute[];
    readonly inputs?: readonly TInput[];
    readonly outputs?: readonly TOutput[];
  }): this;

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public sign(key: PrivateKey): this {
    return this.clone({
      scripts: this.scripts.concat([
        // tslint:disable-next-line no-any
        crypto.createWitness(this.serializeUnsigned(), key, (this.constructor as any).WitnessConstructor),
      ]),
    });
  }

  public signWithSignature(signature: Buffer, publicKey: ECPoint): this {
    return this.clone({
      scripts: this.scripts.concat([
        // tslint:disable-next-line no-any
        crypto.createWitnessForSignature(signature, publicKey, (this.constructor as any).WitnessConstructor),
      ]),
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
}
