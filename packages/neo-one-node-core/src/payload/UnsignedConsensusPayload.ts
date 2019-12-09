import { BinaryWriter, UInt256 } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { BinaryReader } from '../utils';
import { ConsensusMessage, deserializeConsensusMessageWire } from './message';

export interface UnsignedConsensusPayloadAdd {
  readonly version: number;
  readonly previousHash: UInt256;
  readonly blockIndex: number;
  readonly validatorIndex: number;
  readonly timestamp?: number;
  readonly consensusMessage: ConsensusMessage;
}

export class UnsignedConsensusPayload implements SerializableWire<UnsignedConsensusPayload> {
  public static readonly deserializeUnsignedConsensusPayloadWireBase = (options: DeserializeWireBaseOptions) => {
    const { reader } = options;
    const version = reader.readUInt32LE();
    const previousHash = reader.readUInt256();
    const blockIndex = reader.readUInt32LE();
    const validatorIndex = reader.readUInt16LE();
    const messageBytes = reader.readVarBytesLE();
    const consensusMessage = deserializeConsensusMessageWire({
      context: options.context,
      buffer: messageBytes,
    });

    return {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      consensusMessage,
    };
  };

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
  public readonly consensusMessage: ConsensusMessage;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({
    version,
    previousHash,
    blockIndex,
    validatorIndex,
    consensusMessage,
  }: UnsignedConsensusPayloadAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.blockIndex = blockIndex;
    this.validatorIndex = validatorIndex;
    this.consensusMessage = consensusMessage;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt16LE(this.validatorIndex);
    writer.writeVarBytesLE(this.consensusMessage.serializeWire());
  }
}
