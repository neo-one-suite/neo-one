import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../../Serializable';
import { BinaryReader, BinaryWriter } from '../../utils';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface ConsensusMessageBaseAdd {
  readonly viewNumber: number;
}

export interface ConsensusMessageBaseAddWithType<Type extends ConsensusMessageType> extends ConsensusMessageBaseAdd {
  readonly type: Type;
}

// tslint:disable-next-line no-any
export class ConsensusMessageBase<T = any, Type extends ConsensusMessageType = ConsensusMessageType>
  implements SerializableWire<T> {
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

  public readonly type: Type;
  public readonly viewNumber: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, viewNumber }: ConsensusMessageBaseAddWithType<Type>) {
    this.type = type;
    this.viewNumber = viewNumber;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.viewNumber);
  }
}
