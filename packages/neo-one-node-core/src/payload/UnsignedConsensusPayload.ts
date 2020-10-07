import { BinaryWriter, common, createGetHashData, createSerializeWire, crypto, UInt256 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { ConsensusMessage, deserializeConsensusMessageWire } from './message/ConsensusMessage';

export interface UnsignedConsensusPayloadAdd {
  readonly version: number;
  readonly previousHash: UInt256;
  readonly blockIndex: number;
  readonly validatorIndex: number;
  readonly data?: Buffer;
  readonly getConsensusMessage?: () => ConsensusMessage;
  readonly consensusMessage?: ConsensusMessage;
  readonly magic?: number;
}

export class UnsignedConsensusPayload implements SerializableWire {
  public static deserializeUnsignedConsensusPayloadWireBase(
    options: DeserializeWireBaseOptions,
    validatorCount = 7,
  ): UnsignedConsensusPayloadAdd {
    const { reader } = options;
    const version = reader.readUInt32LE();
    const previousHash = reader.readUInt256();
    const blockIndex = reader.readUInt32LE();
    const validatorIndex = reader.readUInt16LE();
    const data = reader.readVarBytesLE();

    const getConsensusMessage = utils.lazy(() =>
      deserializeConsensusMessageWire({ context: options.context, buffer: data }, validatorCount),
    );

    return {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      data,
      getConsensusMessage,
      magic: options.context.messageMagic,
    };
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): UnsignedConsensusPayload {
    return new this(this.deserializeUnsignedConsensusPayloadWireBase(options));
  }

  public static deserializeWire(options: DeserializeWireOptions): UnsignedConsensusPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly version: number;
  public readonly previousHash: UInt256;
  public readonly blockIndex: number;
  public readonly validatorIndex: number;
  public readonly magic: number | undefined;

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly consensusMessageInternal: (() => ConsensusMessage) | undefined;
  private readonly dataInternal?: Buffer;
  private readonly messageInternal = utils.lazy(() => createGetHashData(this.serializeWire, this.magic)());
  private readonly hashInternal = utils.lazy(() => crypto.hash256(this.messageInternal()));

  public constructor({
    version,
    previousHash,
    blockIndex,
    validatorIndex,
    data,
    getConsensusMessage,
    consensusMessage,
    magic,
  }: UnsignedConsensusPayloadAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.blockIndex = blockIndex;
    this.validatorIndex = validatorIndex;
    this.dataInternal = data;

    this.consensusMessageInternal = consensusMessage ? () => consensusMessage : getConsensusMessage;
    this.magic = magic;
  }

  public get consensusMessage() {
    if (this.consensusMessageInternal === undefined) {
      // TODO: Implement an error here;
      throw new Error('need a way to get consensusMessage');
    }

    return this.consensusMessageInternal();
  }

  public get data() {
    if (this.dataInternal === undefined) {
      return this.consensusMessage.serializeWire();
    }

    return this.dataInternal;
  }

  public get hash() {
    return this.hashInternal();
  }

  public get hashHex() {
    return common.uInt256ToHex(this.hash);
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt16LE(this.validatorIndex);
    writer.writeVarBytesLE(this.data);
  }
}
