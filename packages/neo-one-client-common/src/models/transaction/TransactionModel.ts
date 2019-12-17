import { Constructor } from '@neo-one/utils';
import { BN } from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { common, ECPoint, InvalidFormatError, PrivateKey, UInt160, UInt256, UInt256Hex } from '../../common';
import { crypto } from '../../crypto';
import { utils } from '../../utils';
import { CosignerModel } from '../CosignerModel';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';

export interface TransactionModelAdd<
  TAttribute extends AttributeModel,
  TWitness extends WitnessModel,
  TCosigner extends CosignerModel
> {
  readonly version?: number;
  readonly attributes?: readonly TAttribute[];
  readonly witnesses?: readonly TWitness[];
  readonly cosigners?: readonly TCosigner[];
  readonly nonce: number;
  readonly sender: UInt160;
  readonly systemFee: BN;
  readonly networkFee: BN;
  readonly validUntilBlock: number;
  readonly script: Buffer;
  readonly hash?: UInt256;
}

export const MAX_TRANSACTION_ATTRIBUTES = 16;
export const MAX_VALID_UNTIL_BLOCK_INCREMENT = 102400;

export class TransactionModel<
  TAttribute extends AttributeModel = AttributeModel,
  TWitness extends WitnessModel = WitnessModel,
  TCosigner extends CosignerModel = CosignerModel
> implements SerializableWire<TransactionModel> {
  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public static readonly VERSION: number = 0;
  public static readonly maxTransactionSize = MAX_VALID_UNTIL_BLOCK_INCREMENT;
  public static readonly maxValidUntilBlockIncrement = 2102400;
  public static readonly maxTransactionAttributes = MAX_TRANSACTION_ATTRIBUTES;
  public static readonly maxCosigners = 16;
  protected static readonly WitnessConstructor: Constructor<WitnessModel> = WitnessModel;

  public readonly version: number;
  public readonly nonce: number;
  public readonly sender: UInt160;
  public readonly systemFee: BN;
  public readonly networkFee: BN;
  public readonly validUntilBlock: number;
  public readonly attributes: readonly TAttribute[];
  public readonly cosigners: readonly TCosigner[];
  public readonly script: Buffer;
  public readonly witnesses: readonly TWitness[];

  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase.bind(this));

  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());

  public constructor({
    version,
    nonce,
    sender,
    attributes = [],
    witnesses = [],
    cosigners = [],
    systemFee,
    networkFee,
    validUntilBlock,
    script,
    hash,
  }: TransactionModelAdd<TAttribute, TWitness, TCosigner>) {
    // workaround: babel fails to transpile if we have
    // static VERSION: number = 0;
    this.version = version === undefined ? (this.constructor as typeof TransactionModel).VERSION : version;
    this.nonce = nonce;
    this.sender = sender;
    this.attributes = attributes;
    this.witnesses = witnesses;
    this.cosigners = cosigners;
    this.systemFee = systemFee;
    this.networkFee = networkFee;
    this.validUntilBlock = validUntilBlock;
    this.script = script;
    const hashIn = hash;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError(
        `Expected less than ${MAX_TRANSACTION_ATTRIBUTES} attributes, found: ${attributes.length}`,
      );
    }
  }
  public clone(options: { readonly witnesses?: readonly TWitness[] } = {}): this {
    // tslint:disable-next-line: no-any
    return new (this.constructor as any)({
      version: this.version,
      nonce: this.nonce,
      sender: this.sender,
      systemFee: this.systemFee,
      networkFee: this.networkFee,
      validUntilBlock: this.validUntilBlock,
      attributes: this.attributes,
      cosigners: this.cosigners,
      script: this.script,
      hash: this.hash,
      witnesses: options.witnesses === undefined ? this.witnesses : options.witnesses,
    });
  }

  public sign(key: PrivateKey): this {
    return this.clone({
      witnesses: this.witnesses.concat([
        // tslint:disable-next-line no-any
        crypto.createWitness(this.serializeUnsigned(), key, (this.constructor as any).WitnessConstructor),
      ]),
    });
  }

  public signWithSignature(signature: Buffer, publicKey: ECPoint): this {
    return this.clone({
      witnesses: this.witnesses.concat([
        // tslint:disable-next-line no-any
        crypto.createWitnessForSignature(signature, publicKey, (this.constructor as any).WitnessConstructor),
      ]),
    });
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt32LE(this.nonce);
    writer.writeUInt160(this.sender);
    writer.writeUInt64LE(this.systemFee);
    writer.writeUInt64LE(this.networkFee);
    writer.writeUInt32LE(this.validUntilBlock);
    writer.writeArray(this.attributes, (attribute) => {
      attribute.serializeWireBase(writer);
    });
    writer.writeArray(this.cosigners, (cosigner) => {
      cosigner.serializeWireBase(writer);
    });
    writer.writeVarBytesLE(this.script);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeArray(this.witnesses, (witness) => {
      witness.serializeWireBase(writer);
    });
  }
}
