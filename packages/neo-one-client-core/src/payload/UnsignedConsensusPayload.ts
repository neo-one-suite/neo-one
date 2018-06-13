import { utils as commonUtils } from '@neo-one/utils';
import { BinaryWriter, BinaryReader } from '../utils';
import { ConsensusMessage, deserializeConsensusMessageWire } from './message';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializeWire,
  SerializableWire,
  createSerializeWire,
} from '../Serializable';
import { UInt256 } from '../common';

export interface UnsignedConsensusPayloadAdd {
  version: number;
  previousHash: UInt256;
  blockIndex: number;
  validatorIndex: number;
  timestamp?: number;
  consensusMessage: ConsensusMessage;
}

export class UnsignedConsensusPayload
  implements SerializableWire<UnsignedConsensusPayload> {
  public static readonly deserializeUnsignedConsensusPayloadWireBase = (
    options: DeserializeWireBaseOptions,
  ) => {
    const { reader } = options;
    const version = reader.readUInt32LE();
    const previousHash = reader.readUInt256();
    const blockIndex = reader.readUInt32LE();
    const validatorIndex = reader.readUInt16LE();
    const timestamp = reader.readUInt32LE();
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
      timestamp,
      consensusMessage,
    };
  }

  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): UnsignedConsensusPayload {
    return new this(this.deserializeUnsignedConsensusPayloadWireBase(options));
  }

  public static deserializeWire(
    options: DeserializeWireOptions,
  ): UnsignedConsensusPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly version: number;
  public readonly previousHash: UInt256;
  public readonly blockIndex: number;
  public readonly validatorIndex: number;
  public readonly timestamp: number;
  public readonly consensusMessage: ConsensusMessage;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  constructor({
    version,
    previousHash,
    blockIndex,
    validatorIndex,
    timestamp,
    consensusMessage,
  }: UnsignedConsensusPayloadAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.blockIndex = blockIndex;
    this.validatorIndex = validatorIndex;
    this.timestamp = timestamp == null ? commonUtils.nowSeconds() : timestamp;
    this.consensusMessage = consensusMessage;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt16LE(this.validatorIndex);
    writer.writeUInt32LE(this.timestamp);
    writer.writeVarBytesLE(this.consensusMessage.serializeWire());
  }
}
