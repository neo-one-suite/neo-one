/* @flow */
import {
  type BinaryWriter,
  type Equatable,
  type Equals,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type UInt160,
  type UInt160Hex,
  BinaryReader,
  Input,
  IOHelper,
  common,
  createSerializeWire,
  utils,
} from '@neo-one/client-core';

export type AccountInputKey = {|
  hash: UInt160,
  input: Input,
|};
export type AccountInputsKey = {|
  hash: UInt160,
|};
export type AccountInputAdd = {|
  hash: UInt160,
  input: Input,
|};

export default class AccountInput implements Equatable, SerializableWire<this> {
  hash: UInt160;
  hashHex: UInt160Hex;
  input: Input;

  __size: () => number;

  constructor({ hash, input }: AccountInputAdd) {
    this.hash = hash;
    this.hashHex = common.uInt160ToHex(hash);
    this.input = input;
    this.__size = utils.lazy(() => IOHelper.sizeOfUInt160 + this.input.size);
  }

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(
    AccountInput,
    other =>
      common.uInt160Equal(this.hash, other.hash) &&
      this.input.equals(other.input),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    this.input.serializeWireBase(writer);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const hash = reader.readUInt160();
    const input = Input.deserializeWireBase(options);

    // $FlowFixMe
    return new this({ hash, input });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
