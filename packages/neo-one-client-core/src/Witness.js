/* @flow */
import { type Equatable, type Equals } from './Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type SerializeJSONContext,
  type SerializableJSON,
  createSerializeWire,
} from './Serializable';

import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export type WitnessAdd = {|
  verification: Buffer,
  invocation: Buffer,
|};

export type WitnessJSON = {|
  invocation: string,
  verification: string,
|};

export default class Witness
  implements
    SerializableWire<Witness>,
    SerializableJSON<WitnessJSON>,
    Equatable {
  verification: Buffer;
  invocation: Buffer;

  constructor({ invocation, verification }: WitnessAdd) {
    this.invocation = invocation;
    this.verification = verification;
  }

  __size = utils.lazy(
    () =>
      IOHelper.sizeOfVarBytesLE(this.invocation) +
      IOHelper.sizeOfVarBytesLE(this.verification),
  );

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(
    Witness,
    other =>
      this.invocation.equals(other.invocation) &&
      this.verification.equals(other.verification),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.invocation);
    writer.writeVarBytesLE(this.verification);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Witness {
    const invocation = reader.readVarBytesLE(utils.USHORT_MAX_NUMBER_PLUS_ONE);
    const verification = reader.readVarBytesLE(
      utils.USHORT_MAX_NUMBER_PLUS_ONE,
    );

    return new this({ invocation, verification });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): WitnessJSON {
    return {
      invocation: JSONHelper.writeBuffer(this.invocation),
      verification: JSONHelper.writeBuffer(this.verification),
    };
  }
}
