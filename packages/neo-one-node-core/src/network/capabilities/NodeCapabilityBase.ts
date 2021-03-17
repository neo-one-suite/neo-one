import { BinaryReader, BinaryWriter } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { assertNodeCapabilityType, NodeCapabilityType } from './NodeCapabilityType';

export interface NodeCapabilityBaseAdd {
  readonly type: NodeCapabilityType;
}

export class NodeCapabilityBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): NodeCapabilityBaseAdd {
    const { reader } = options;
    const type = assertNodeCapabilityType(reader.readInt8());

    return {
      type,
    };
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }
  public readonly type: NodeCapabilityType;

  public constructor({ type }: NodeCapabilityBaseAdd) {
    this.type = type;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt8(this.type);
  }
}
