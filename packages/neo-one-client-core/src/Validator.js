/* @flow */
import type BN from 'bn.js';

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
  registered?: boolean,
  votes?: BN,
|};
export type ValidatorUpdate = {|
  registered?: boolean,
  votes?: BN,
|};

export type ValidatorJSON = {|
  version: number,
  publicKey: string,
  registered: boolean,
  votes: string,
|};

export default class Validator extends BaseState
  implements
    SerializableWire<Validator>,
    Equatable,
    SerializableJSON<ValidatorJSON> {
  publicKey: ECPoint;
  registered: boolean;
  votes: BN;

  __size: () => number;

  constructor({ version, publicKey, registered, votes }: ValidatorAdd) {
    super({ version });
    this.publicKey = publicKey;
    this.registered = registered == null ? false : registered;
    this.votes = votes == null ? utils.ZERO : votes;
    this.__size = utils.lazy(
      () =>
        IOHelper.sizeOfECPoint(this.publicKey) +
        IOHelper.sizeOfBoolean +
        IOHelper.sizeOfFixed8,
    );
  }

  get size(): number {
    return this.__size();
  }

  update({ votes, registered }: ValidatorUpdate): Validator {
    return new Validator({
      version: this.version,
      publicKey: this.publicKey,
      registered: registered == null ? this.registered : registered,
      votes: votes == null ? this.votes : votes,
    });
  }

  equals: Equals = utils.equals(Validator, other =>
    common.ecPointEqual(this.publicKey, other.publicKey),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeECPoint(this.publicKey);
    writer.writeBoolean(this.registered);
    writer.writeFixed8(this.votes);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): Validator {
    const version = reader.readUInt8();
    const publicKey = reader.readECPoint();
    const registered = reader.readBoolean();
    const votes = reader.readFixed8();

    return new this({ version, publicKey, registered, votes });
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
      registered: this.registered,
      votes: JSONHelper.writeFixed8(this.votes),
    };
  }
}
