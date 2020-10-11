import { BinaryWriter, createSerializeWire } from '@neo-one/client-common';
import { InvalidServerCapabilityTypeError } from '../../errors';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { BinaryReader } from '../../utils';
import { NodeCapabilityBase, NodeCapabilityBaseAdd } from './NodeCapabilityBase';
import { NodeCapabilityType } from './NodeCapabilityType';

export interface ServerCapabilityAdd extends NodeCapabilityBaseAdd {
  readonly port: number;
}

export class ServerCapability extends NodeCapabilityBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ServerCapability {
    const { type } = super.deserializeWireBase(options);
    const { reader } = options;

    const port = reader.readUInt16LE();

    return new this({
      type,
      port,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ServerCapability {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }

  public readonly port: number;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, port }: ServerCapabilityAdd) {
    super({ type });
    if (type !== NodeCapabilityType.TcpServer && type !== NodeCapabilityType.WsServer) {
      throw new InvalidServerCapabilityTypeError(type);
    }

    this.port = port;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeUInt16LE(this.port);
  }
}
