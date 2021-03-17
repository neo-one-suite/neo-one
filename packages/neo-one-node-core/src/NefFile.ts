import { BinaryReader, crypto, NefFileJSON, NefFileModel } from '@neo-one/client-common';
import { MethodToken } from './MethodToken';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from './Serializable';

export class NefFile extends NefFileModel implements SerializableJSON<NefFileJSON> {
  public static readonly maxScriptLength = 512 * 1024;

  public static deserializeWireBase(options: DeserializeWireBaseOptions): NefFile {
    const { reader } = options;
    const magic = reader.readUInt32LE();
    if (magic !== this.magic) {
      throw new Error('Wrong magic');
    }
    const compiler = reader.readFixedString(64);
    const firstReserved = reader.readUInt16LE();
    if (firstReserved !== 0) {
      throw new Error('Reserved bytes must be 0');
    }
    const tokens = reader.readArray(() => MethodToken.deserializeWireBase(options), 128);
    const secondReserved = reader.readUInt16LE();
    if (secondReserved !== 0) {
      throw new Error('Reserved bytes must be 0');
    }
    const script = reader.readVarBytesLE(this.maxScriptLength);
    if (script.length === 0) {
      throw new Error("Script can't be empty");
    }
    const checkSum = reader.readUInt32LE();
    const nef = new this({
      compiler,
      tokens,
      script,
    });

    if (checkSum !== nef.checkSum) {
      throw new Error('CRC verification fail');
    }

    return nef;
  }

  public static deserializeWire(options: DeserializeWireOptions): NefFile {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static computeCheckSum(file: NefFile) {
    const buff = file.serializeWire().slice(0, -4);
    const hash = crypto.hash256(buff);

    return hash.readUInt32LE();
  }
}
