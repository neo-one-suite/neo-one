/* @flow */
import { utils as commonUtils } from '@neo-one/utils';
import { type BinaryWriter, BinaryReader } from '../utils';
import {
  type ConsensusMessage,
  deserializeConsensusMessageWire,
} from './message';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../Serializable';
import { type UInt256 } from '../common';

export type UnsignedConsensusPayloadAdd = {|
  version: number,
  previousHash: UInt256,
  blockIndex: number,
  validatorIndex: number,
  timestamp?: number,
  consensusMessage: ConsensusMessage,
|};

export default class UnsignedConsensusPayload
  implements SerializableWire<UnsignedConsensusPayload> {
  version: number;
  previousHash: UInt256;
  blockIndex: number;
  validatorIndex: number;
  timestamp: number;
  consensusMessage: ConsensusMessage;

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

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt16LE(this.validatorIndex);
    writer.writeUInt32LE(this.timestamp);
    writer.writeVarBytesLE(this.consensusMessage.serializeWire());
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeUnsignedConsensusPayloadWireBase = (
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
  };

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): UnsignedConsensusPayload {
    return new this(this.deserializeUnsignedConsensusPayloadWireBase(options));
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
