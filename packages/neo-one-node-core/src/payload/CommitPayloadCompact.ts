import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../Serializable';

export interface CommitPayloadCompactAdd {
  readonly viewNumber: number;
  readonly validatorIndex: number;
  readonly signature: Buffer;
  readonly invocationScript: Buffer;
}

export class CommitPayloadCompact implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): CommitPayloadCompact {
    const { reader } = options;
    const viewNumber = reader.readUInt8();
    const validatorIndex = reader.readUInt16LE();
    if (validatorIndex >= options.context.validatorsCount) {
      throw new InvalidFormatError('Validator index cannot be greater than validators count');
    }
    const signature = reader.readBytes(64);
    const invocationScript = reader.readVarBytesLE(1024);

    return new CommitPayloadCompact({
      viewNumber,
      validatorIndex,
      signature,
      invocationScript,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): CommitPayloadCompact {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly validatorIndex: number;
  public readonly viewNumber: number;
  public readonly signature: Buffer;
  public readonly invocationScript: Buffer;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ validatorIndex, viewNumber, signature, invocationScript }: CommitPayloadCompactAdd) {
    this.validatorIndex = validatorIndex;
    this.viewNumber = viewNumber;
    this.signature = signature;
    this.invocationScript = invocationScript;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeInt16LE(this.validatorIndex);
    writer.writeUInt8(this.viewNumber);
    writer.writeBytes(this.signature);
    writer.writeVarBytesLE(this.invocationScript);
  }
}
