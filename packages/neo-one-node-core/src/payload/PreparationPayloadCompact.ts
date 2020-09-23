import { BinaryWriter, createSerializeWire, SerializableWire } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../Serializable';
import { BinaryReader } from '../utils';

export interface PreparationPayloadCompactAdd {
  readonly validatorIndex: number;
  readonly invocationScript: Buffer;
}

export class PreparationPayloadCompact implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PreparationPayloadCompact {
    const { reader } = options;
    const validatorIndex = reader.readUInt16LE();
    const invocationScript = reader.readVarBytesLE(1024);

    return new PreparationPayloadCompact({
      validatorIndex,
      invocationScript,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): PreparationPayloadCompact {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly validatorIndex: number;
  public readonly invocationScript: Buffer;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase);

  public constructor({ validatorIndex, invocationScript }: PreparationPayloadCompactAdd) {
    this.validatorIndex = validatorIndex;
    this.invocationScript = invocationScript;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeInt16LE(this.validatorIndex);
    writer.writeVarBytesLE(this.invocationScript);
  }
}
