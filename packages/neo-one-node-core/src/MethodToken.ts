import { BinaryReader, InvalidFormatError, MethodTokenJSON, MethodTokenModel } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from './Serializable';

export class MethodToken extends MethodTokenModel implements SerializableJSON<MethodTokenJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MethodToken {
    const { reader } = options;

    const hash = reader.readUInt160();
    const method = reader.readVarString(32);
    if (method.startsWith('_')) {
      throw new InvalidFormatError('Method cannot start with "_"');
    }
    const paramCount = reader.readUInt16LE();
    const hasReturnValue = reader.readBoolean();
    const callFlags = reader.readUInt8();

    return new this({
      hash,
      method,
      paramCount,
      hasReturnValue,
      callFlags,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): MethodToken {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
