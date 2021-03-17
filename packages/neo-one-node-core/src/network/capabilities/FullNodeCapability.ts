import { BinaryReader, BinaryWriter, createSerializeWire, InvalidFormatError } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { NodeCapabilityBase } from './NodeCapabilityBase';
import { NodeCapabilityType } from './NodeCapabilityType';

export interface FullNodeCapabilityAdd {
  readonly startHeight: number;
}

export class FullNodeCapability extends NodeCapabilityBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): FullNodeCapability {
    const { reader } = options;
    const { type } = super.deserializeWireBase(options);
    if (type !== NodeCapabilityType.FullNode) {
      throw new InvalidFormatError();
    }
    const startHeight = reader.readUInt32LE();

    return new this({
      startHeight,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): FullNodeCapability {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }

  public readonly startHeight: number;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ startHeight }: FullNodeCapabilityAdd) {
    super({ type: NodeCapabilityType.FullNode });

    this.startHeight = startHeight;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeUInt32LE(this.startHeight);
  }
}
