import { BinaryReader, BinaryWriter, createSerializeWire, SerializableWire } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../Serializable';

export interface ChangeViewPayloadCompactAdd {
  readonly validatorIndex: number;
  readonly originalViewNumber: number;
  readonly timestamp: BN;
  readonly invocationScript: Buffer;
}

export class ChangeViewPayloadCompact implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ChangeViewPayloadCompact {
    const { reader } = options;
    const validatorIndex = reader.readUInt16LE();
    const originalViewNumber = reader.readUInt8();
    const timestamp = reader.readUInt64LE();
    const invocationScript = reader.readVarBytesLE(1024);

    return new ChangeViewPayloadCompact({
      validatorIndex,
      originalViewNumber,
      timestamp,
      invocationScript,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ChangeViewPayloadCompact {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly validatorIndex: number;
  public readonly originalViewNumber: number;
  public readonly timestamp: BN;
  public readonly invocationScript: Buffer;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ validatorIndex, originalViewNumber, timestamp, invocationScript }: ChangeViewPayloadCompactAdd) {
    this.validatorIndex = validatorIndex;
    this.originalViewNumber = originalViewNumber;
    this.timestamp = timestamp;
    this.invocationScript = invocationScript;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeInt16LE(this.validatorIndex);
    writer.writeUInt8(this.originalViewNumber);
    writer.writeUInt64LE(this.timestamp);
    writer.writeVarBytesLE(this.invocationScript);
  }
}
