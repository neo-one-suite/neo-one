import { BN } from 'bn.js';
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
  readonly version?: number;
  readonly index: BN;
  readonly scriptHash: UInt160;
}

export interface ActionBaseAddWithType<Type extends ActionType> extends ActionBaseAdd {
  readonly type: Type;
}

export interface ActionBaseJSON {
  readonly version: number;
  readonly index: string;
  readonly scriptHash: string;
}

// tslint:disable-next-line no-any
export class ActionBase<T = any, Type extends ActionType = ActionType> implements SerializableWire<T> {
  public static readonly VERSION = 0;

  public static readonly deserializeActionBaseWireBase = ({ reader }: DeserializeWireBaseOptions) => {
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

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): ActionBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): ActionBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: Type;
  public readonly version: number;
  public readonly index: BN;
  public readonly scriptHash: UInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, version, index, scriptHash }: ActionBaseAddWithType<Type>) {
    this.type = type;
    this.version = version === undefined ? (this.constructor as typeof ActionBase).VERSION : version;
    this.index = index;
    this.scriptHash = scriptHash;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    writer.writeUInt64LE(this.index);
    writer.writeUInt160(this.scriptHash);
  }

  public serializeActionBaseJSON(_context: SerializeJSONContext): ActionBaseJSON {
    return {
      version: this.version,
      index: JSONHelper.writeUInt64(this.index),
      scriptHash: JSONHelper.writeUInt160(this.scriptHash),
    };
  }
}
