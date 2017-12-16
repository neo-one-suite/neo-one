/* @/* @flow */
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
import { type UInt160, type UInt256 } from '../common';

export type ActionBaseAdd = {|
  version?: number,
  blockIndex: number,
  blockHash: UInt256,
  transactionIndex: number,
  transactionHash: UInt256,
  index: number,
  scriptHash: UInt160,
|};
export type ActionBaseAddWithType<Type: ActionType> = {|
  ...ActionBaseAdd,
  type: Type,
|};

export type ActionBaseJSON = {|
  version: number,
  blockIndex: number,
  blockHash: string,
  transactionIndex: number,
  transactionHash: string,
  index: number,
  scriptHash: string,
|};

export default class ActionBase<T, Type: ActionType>
  implements SerializableWire<T> {
  static VERSION = 0;

  type: Type;
  version: number;
  blockIndex: number;
  blockHash: UInt256;
  transactionIndex: number;
  transactionHash: UInt256;
  index: number;
  scriptHash: UInt160;

  constructor({
    type,
    version,
    blockIndex,
    blockHash,
    transactionIndex,
    transactionHash,
    index,
    scriptHash,
  }: ActionBaseAddWithType<Type>) {
    this.type = type;
    this.version = version == null ? this.constructor.VERSION : version;
    this.blockIndex = blockIndex;
    this.blockHash = blockHash;
    this.transactionIndex = transactionIndex;
    this.transactionHash = transactionHash;
    this.index = index;
    this.scriptHash = scriptHash;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt256(this.blockHash);
    writer.writeUInt32LE(this.transactionIndex);
    writer.writeUInt256(this.transactionHash);
    writer.writeUInt32LE(this.index);
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
    const blockIndex = reader.readUInt32LE();
    const blockHash = reader.readUInt256();
    const transactionIndex = reader.readUInt32LE();
    const transactionHash = reader.readUInt256();
    const index = reader.readUInt32LE();
    const scriptHash = reader.readUInt160();

    return {
      type,
      version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
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
      blockIndex: this.blockIndex,
      blockHash: JSONHelper.writeUInt256(this.blockHash),
      transactionIndex: this.transactionIndex,
      transactionHash: JSONHelper.writeUInt256(this.transactionHash),
      index: this.index,
      scriptHash: JSONHelper.writeUInt160(this.scriptHash),
    };
  }
}
