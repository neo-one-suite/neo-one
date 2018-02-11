/* @flow */
import type BN from 'bn.js';
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BaseState,
  BinaryReader,
  IOHelper,
  createSerializeWire,
  utils,
} from '@neo-one/client-core';

type Votes = Array<?BN>;
export type ValidatorsCountUpdate = {|
  votes?: Votes,
|};
export type ValidatorsCountAdd = {|
  version?: number,
  votes?: Votes,
|};

export default class ValidatorsCount extends BaseState
  implements SerializableWire<this> {
  votes: Votes;

  __size: () => number;

  constructor(addIn?: ValidatorsCountAdd) {
    const add = addIn || {};
    super({ version: add.version });
    this.votes = add.votes || [];
    this.__size = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfArray(this.votes, () => IOHelper.sizeOfFixed8),
    );
  }

  get size(): number {
    return this.__size();
  }

  update({ votes }: ValidatorsCountUpdate): ValidatorsCount {
    return new this.constructor({
      version: this.version,
      votes: votes == null ? this.votes : votes,
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeArray(this.votes, value => {
      writer.writeFixed8(value || utils.ZERO);
    });
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const version = reader.readUInt8();
    const votes = reader.readArray(() => reader.readFixed8());

    return new this({ version, votes });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
