/* @flow */
import { type Equatable, type Equals } from '../Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeJSONContext,
  type SerializableJSON,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../Serializable';

import common, { type UInt256 } from '../common';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from '../utils';

export type InputAdd = {|
  hash: UInt256,
  index: number,
|};

export type InputJSON = {|
  txid: string,
  vout: number,
|};

export default class Input
  implements SerializableWire<Input>, Equatable, SerializableJSON<InputJSON> {
  hash: UInt256;
  index: number;
  size: number = IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt16LE;

  constructor({ hash, index }: InputAdd) {
    this.hash = hash;
    this.index = index;
  }

  equals: Equals = utils.equals(
    Input,
    other =>
      common.uInt256Equal(this.hash, other.hash) && other.index === this.index,
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt16LE(this.index);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Input {
    const hash = reader.readUInt256();
    const index = reader.readUInt16LE();
    return new this({ hash, index });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): InputJSON {
    return {
      txid: JSONHelper.writeUInt256(this.hash),
      vout: this.index,
    };
  }
}
