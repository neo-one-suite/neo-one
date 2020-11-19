import { Constructor } from '@neo-one/utils';
import BN from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { common, ECPoint, InvalidFormatError, PrivateKey, UInt160, UInt256, UInt256Hex } from '../../common';
import { crypto } from '../../crypto';
import { utils } from '../../utils';
import { createSerializeWire, getHashData, SerializableWire, SerializeWire } from '../Serializable';
import { SignerModel } from '../SignerModel';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';

export interface TransactionConsensusOptions {
  readonly nonce: number;
  readonly validUntilBlock: number;
  readonly messageMagic: number;
}

export interface TransactionFeesAdd {
  readonly systemFee: BN;
  readonly networkFee: BN;
}

export interface FeelessTransactionModelAdd<
  TAttribute extends AttributeModel = AttributeModel,
  TWitness extends WitnessModel = WitnessModel,
  TSigner extends SignerModel = SignerModel
> {
  readonly version?: number;
  readonly nonce?: number;
  readonly validUntilBlock: number;
  readonly attributes?: readonly TAttribute[];
  readonly signers?: readonly TSigner[];
  readonly script: Buffer;
  readonly witnesses?: readonly TWitness[];
  readonly hash?: UInt256;
  readonly messageMagic: number;
}

export const MAX_TRANSACTION_ATTRIBUTES = 16;
export const MAX_TRANSACTION_SIZE = 102400;
export const MAX_VALID_UNTIL_BLOCK_INCREMENT = 2102400;
export const DEFAULT_VERSION = 0;

export class FeelessTransactionModel<
  TAttribute extends AttributeModel = AttributeModel,
  TWitness extends WitnessModel = WitnessModel,
  TSigner extends SignerModel = SignerModel
> implements SerializableWire {
  public static readonly VERSION: number = 0;
  public static readonly maxTransactionSize = MAX_TRANSACTION_SIZE;
  public static readonly maxValidBlockIncrement = MAX_VALID_UNTIL_BLOCK_INCREMENT;
  public static readonly maxTransactionAttributes = MAX_TRANSACTION_ATTRIBUTES;
  protected static readonly WitnessConstructor: Constructor<WitnessModel> = WitnessModel;

  public readonly version: number;
  public readonly nonce: number;
  public readonly validUntilBlock: number;
  public readonly signers: readonly TSigner[];
  public readonly sender?: UInt160;
  public readonly attributes: readonly TAttribute[];
  public readonly script: Buffer;
  public readonly witnesses: readonly TWitness[];
  public readonly messageMagic: number;

  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase.bind(this));
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => getHashData(this.serializeUnsigned(), this.messageMagic));

  public constructor({
    version,
    nonce = 0,
    attributes = [],
    witnesses = [],
    signers = [],
    validUntilBlock,
    script,
    hash,
    messageMagic,
  }: FeelessTransactionModelAdd<TAttribute, TWitness, TSigner>) {
    this.version = version === undefined ? DEFAULT_VERSION : version;
    this.nonce = nonce;
    this.sender = signers[0]?.account;
    this.attributes = attributes;
    this.witnesses = witnesses;
    this.signers = signers;
    this.validUntilBlock = validUntilBlock;
    this.script = script;
    this.messageMagic = messageMagic;
    const hashIn = hash;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError(
        `Expected less than ${MAX_TRANSACTION_ATTRIBUTES} attributes, found: ${attributes.length}`,
      );
    }
  }

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public cloneWithConsensusOptions(
    options: TransactionConsensusOptions,
  ): FeelessTransactionModel<TAttribute, TWitness, TSigner> {
    return new FeelessTransactionModel({
      version: this.version,
      attributes: this.attributes,
      signers: this.signers,
      script: this.script,
      hash: this.hash,
      witnesses: this.witnesses,
      nonce: options.nonce,
      validUntilBlock: options.validUntilBlock,
      messageMagic: this.messageMagic,
    });
  }

  public sign(_key: PrivateKey): FeelessTransactionModel<TAttribute, TWitness, TSigner> {
    throw new Error('clone to a fee transaction before signing');
  }

  public signWithSignature(
    _signature: Buffer,
    _publicKey: ECPoint,
  ): FeelessTransactionModel<TAttribute, TWitness, TSigner> {
    throw new Error('clone to a fee transaction before signing');
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt32LE(this.nonce);
    writer.writeUInt64LE(new BN(0));
    writer.writeUInt64LE(new BN(0));
    writer.writeUInt32LE(this.validUntilBlock);
    writer.writeArray(this.signers, (signer) => {
      signer.serializeWireBase(writer);
    });
    writer.writeArray(this.attributes, (attribute) => {
      attribute.serializeWireBase(writer);
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
