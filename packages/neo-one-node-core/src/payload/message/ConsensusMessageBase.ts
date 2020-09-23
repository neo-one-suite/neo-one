import { BinaryWriter } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../../Serializable';
import { BinaryReader } from '../../utils';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface ConsensusMessageBaseAdd {
  readonly viewNumber: number;
}

export interface ConsensusMessageBaseAddWithType extends ConsensusMessageBaseAdd {
  readonly type: ConsensusMessageType;
}

export class ConsensusMessageBase implements SerializableWire {
  public static readonly VERSION = 0;
  public static readonly deserializeConsensusMessageBaseWireBase = ({ reader }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const viewNumber = reader.readUInt8();

    return {
      type,
      viewNumber,
    };
  };

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): ConsensusMessageBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): ConsensusMessageBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: ConsensusMessageType;
  public readonly viewNumber: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, viewNumber }: ConsensusMessageBaseAddWithType) {
    this.type = type;
    this.viewNumber = viewNumber;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.viewNumber);
  }
}
