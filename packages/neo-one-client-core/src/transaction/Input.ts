import { common, UInt256 } from '../common';
import { Equals, EquatableKey } from '../Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';

export interface InputAdd {
  readonly hash: UInt256;
  readonly index: number;
}

export interface InputJSON {
  readonly txid: string;
  readonly vout: number;
}

const SIZE = IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt16LE;
export class Input implements SerializableWire<Input>, EquatableKey, SerializableJSON<InputJSON> {
  public static readonly size: number = SIZE;
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

  public readonly hash: UInt256;
  public readonly hashHex: string;
  public readonly index: number;
  public readonly size: number = SIZE;
  public readonly equals: Equals = utils.equals(
    Input,
    this,
    (other) => common.uInt256Equal(this.hash, other.hash) && other.index === this.index,
  );
  public readonly toKeyString = utils.toKeyString(Input, () => `${this.hashHex}:${this.index}`);
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hash, index }: InputAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.index = index;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt16LE(this.index);
  }

  public serializeJSON(_context: SerializeJSONContext): InputJSON {
    return {
      txid: JSONHelper.writeUInt256(this.hash),
      vout: this.index,
    };
  }
}
