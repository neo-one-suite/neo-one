import BN from 'bn.js';
import { UInt160 } from '../common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../Serializable';
import { BinaryReader, BinaryWriter, JSONHelper } from '../utils';
import { ActionType } from './ActionType';

export interface ActionBaseAdd {
  version?: number;
  index: BN;
  scriptHash: UInt160;
}

export interface ActionBaseAddWithType<Type extends ActionType>
  extends ActionBaseAdd {
  type: Type;
}

export interface ActionBaseJSON {
  version: number;
  index: string;
  scriptHash: string;
}

export class ActionBase<T, Type extends ActionType>
  implements SerializableWire<T> {
  public static readonly VERSION = 0;

  public static readonly deserializeActionBaseWireBase = ({
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

  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): ActionBase<any, any> {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(
    options: DeserializeWireOptions,
  ): ActionBase<any, any> {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: Type;
  public readonly version: number;
  public readonly index: BN;
  public readonly scriptHash: UInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  constructor({
    type,
    version,
    index,
    scriptHash,
  }: ActionBaseAddWithType<Type>) {
    this.type = type;
    this.version =
      version == null
        ? (this.constructor as typeof ActionBase).VERSION
        : version;
    this.index = index;
    this.scriptHash = scriptHash;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    writer.writeUInt64LE(this.index);
    writer.writeUInt160(this.scriptHash);
  }

  public serializeActionBaseJSON(
    context: SerializeJSONContext,
  ): ActionBaseJSON {
    return {
      version: this.version,
      index: JSONHelper.writeUInt64(this.index),
      scriptHash: JSONHelper.writeUInt160(this.scriptHash),
    };
  }
}
