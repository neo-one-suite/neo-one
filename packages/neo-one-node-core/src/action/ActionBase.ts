import { ActionBaseJSON, BinaryReader, BinaryWriter, JSONHelper, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { ActionSource, actionSourceToJSON, ActionType } from './ActionType';

export interface ActionBaseAdd {
  readonly source: ActionSource;
  readonly version?: number;
  readonly index: BN;
  readonly scriptHash: UInt160;
}

export interface ActionBaseAddWithType<Type extends ActionType> extends ActionBaseAdd {
  readonly type: Type;
}

// tslint:disable-next-line no-any
export class ActionBase<Type extends ActionType = ActionType> implements SerializableWire {
  public static readonly VERSION = 0;

  public static readonly deserializeActionBaseWireBase = ({ reader }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const version = reader.readUInt8();
    const index = reader.readUInt64LE();
    const scriptHash = reader.readUInt160();
    const source = reader.readUInt8();

    return {
      type,
      version,
      index,
      scriptHash,
      source,
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
  public readonly source: ActionSource;
  public readonly version: number;
  public readonly index: BN;
  public readonly scriptHash: UInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, version, index, scriptHash, source }: ActionBaseAddWithType<Type>) {
    this.type = type;
    this.version = version === undefined ? (this.constructor as typeof ActionBase).VERSION : version;
    this.index = index;
    this.scriptHash = scriptHash;
    this.source = source;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    writer.writeUInt64LE(this.index);
    writer.writeUInt160(this.scriptHash);
    writer.writeUInt8(this.source);
  }

  public serializeActionBaseJSON(): ActionBaseJSON {
    return {
      version: this.version,
      index: JSONHelper.writeUInt64(this.index),
      scriptHash: JSONHelper.writeUInt160(this.scriptHash),
      source: actionSourceToJSON(this.source),
    };
  }
}
