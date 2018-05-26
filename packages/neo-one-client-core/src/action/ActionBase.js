/* @flow */
import type BN from 'bn.js';

import { type ActionType } from './ActionType';
import { type BinaryWriter, BinaryReader, JSONHelper } from '../utils';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeJSONContext,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../Serializable';
import { type UInt160 } from '../common';

export type ActionBaseAdd = {|
  version?: number,
  index: BN,
  scriptHash: UInt160,
|};
export type ActionBaseAddWithType<Type: ActionType> = {|
  ...ActionBaseAdd,
  type: Type,
|};

export type ActionBaseJSON = {|
  version: number,
  index: string,
  scriptHash: string,
|};

export default class ActionBase<T, Type: ActionType>
  implements SerializableWire<T> {
  static VERSION = 0;

  type: Type;
  version: number;
  index: BN;
  scriptHash: UInt160;

  constructor({
    type,
    version,
    index,
    scriptHash,
  }: ActionBaseAddWithType<Type>) {
    this.type = type;
    this.version = version == null ? this.constructor.VERSION : version;
    this.index = index;
    this.scriptHash = scriptHash;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    writer.writeUInt64LE(this.index);
    writer.writeUInt160(this.scriptHash);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeActionBaseWireBase = ({
    reader,
  }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const version = reader.readUInt8();
    const index = reader.readUInt64LE();
    const scriptHash = reader.readUInt160();

    return {
      type,
      version,
      index,
      scriptHash,
    };
  };

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    throw new Error('Not Implemented');
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeActionBaseJSON(context: SerializeJSONContext): ActionBaseJSON {
    return {
      version: this.version,
      index: JSONHelper.writeUInt64(this.index),
      scriptHash: JSONHelper.writeUInt160(this.scriptHash),
    };
  }
}
