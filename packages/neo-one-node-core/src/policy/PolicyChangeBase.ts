import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, PolicyChangeJSONBase } from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface PolicyChangeBaseAdd {
  readonly index: BN;
}

export interface PolicyChangeBaseAddWithType<Type extends PolicyChangeType> extends PolicyChangeBaseAdd {
  readonly type: Type;
}

export class PolicyChangeBase<Type extends PolicyChangeType = PolicyChangeType> implements SerializableWire {
  public get size(): number {
    return this.sizeInternal();
  }
  public static readonly deserializePolicyChangeBaseWireBase = ({ reader }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const index = reader.readUInt64LE();

    return { type, index };
  };

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): PolicyChangeBase {
    throw new Error('PolicyChangeBase deserializeWireBase not implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): PolicyChangeBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: Type;
  public readonly index: BN;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ type, index }: PolicyChangeBaseAddWithType<Type>) {
    this.type = type;
    this.index = index;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt64LE + this.sizeExclusive());
  }
  public readonly sizeExclusive: () => number = () => 0;

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt64LE(this.index);
  }

  public serializeJSON(): PolicyChangeJSONBase {
    return {
      type: toPolicyChangeTypeJSON(this.type),
      index: JSONHelper.writeUInt64(this.index),
    };
  }
}
