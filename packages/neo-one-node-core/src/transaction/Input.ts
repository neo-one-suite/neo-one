import { common, InputJSON, InputModel, JSONHelper } from '@neo-one/client-common';
import { Equals, EquatableKey } from '../Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryReader, utils } from '../utils';

export class Input extends InputModel implements EquatableKey, SerializableJSON<InputJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Input {
    const hash = reader.readUInt256();
    const index = reader.readUInt16LE();

    return new this({ hash, index });
  }

  public static deserializeWire(options: DeserializeWireOptions): Input {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly equals: Equals = utils.equals(
    Input,
    this,
    (other) => common.uInt256Equal(this.hash, other.hash) && other.index === this.index,
  );
  public readonly toKeyString = utils.toKeyString(Input, () => `${this.hashHex}:${this.index}`);

  public serializeJSON(_context: SerializeJSONContext): InputJSON {
    return {
      txid: JSONHelper.writeUInt256(this.hash),
      vout: this.index,
    };
  }
}
