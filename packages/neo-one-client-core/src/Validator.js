/* @flow */
import BaseState from './BaseState';
import { type Equatable, type Equals } from './Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeJSONContext,
  type SerializableJSON,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from './Serializable';

import common, { type ECPoint } from './common';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export type ValidatorKey = {|
  publicKey: ECPoint,
|};
export type ValidatorAdd = {|
  version?: number,
  publicKey: ECPoint,
|};

export type ValidatorJSON = {|
  version: number,
  publicKey: string,
|};

export default class Validator extends BaseState
  implements SerializableWire<Validator>,
    Equatable,
    SerializableJSON<ValidatorJSON> {
  publicKey: ECPoint;

  __size: () => number;

  constructor({ version, publicKey }: ValidatorAdd) {
    super({ version });
    this.publicKey = publicKey;
    this.__size = utils.lazy(() => IOHelper.sizeOfECPoint(this.publicKey));
  }

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(Validator, other =>
    common.ecPointEqual(this.publicKey, other.publicKey),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeECPoint(this.publicKey);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): Validator {
    const version = reader.readUInt8();
    const publicKey = reader.readECPoint();

    return new this({ version, publicKey });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): ValidatorJSON {
    return {
      version: this.version,
      publicKey: JSONHelper.writeECPoint(this.publicKey),
    };
  }
}
