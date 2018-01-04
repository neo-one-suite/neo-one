/* @flow */
import type BN from 'bn.js';

import { type Equatable, type Equals } from '../Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type SerializeJSONContext,
  createSerializeWire,
} from '../Serializable';

import common, { type UInt160, type UInt256 } from '../common';
import crypto from '../crypto';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from '../utils';

export type OutputKey = {
  +hash: UInt256,
  +index: number,
};
export type OutputAdd = {|
  asset: UInt256,
  value: BN,
  address: UInt160,
|};

export type OutputJSON = {|
  n: number,
  asset: string,
  value: string,
  address: string,
|};

export default class Output implements SerializableWire<Output>, Equatable {
  asset: UInt256;
  value: BN;
  address: UInt160;
  size: number = IOHelper.sizeOfUInt256 +
    IOHelper.sizeOfUInt16LE +
    IOHelper.sizeOfUInt160;

  constructor({ asset, value, address }: OutputAdd) {
    this.asset = asset;
    this.value = value;
    this.address = address;
  }

  equals: Equals = utils.equals(
    Output,
    other =>
      common.uInt256Equal(this.asset, other.asset) &&
      this.value.eq(other.value) &&
      common.uInt160Equal(this.address, other.address),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.asset);
    writer.writeFixed8(this.value);
    writer.writeUInt160(this.address);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Output {
    const asset = reader.readUInt256();
    const value = reader.readFixed8();
    const address = reader.readUInt160();
    return new this({ asset, value, address });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // TODO: Maybe store index on Output directly? And add it when deserializing
  //       from transaction
  serializeJSON(context: SerializeJSONContext, index: number): Object {
    return {
      n: index,
      asset: JSONHelper.writeUInt256(this.asset),
      value: JSONHelper.writeFixed8(this.value),
      address: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.address,
      }),
    };
  }
}
