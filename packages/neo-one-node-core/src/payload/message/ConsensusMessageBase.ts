import { BinaryReader, BinaryWriter } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../../Serializable';
import { ProtocolSettings } from '../../Settings';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface ConsensusMessageBaseAdd {
  readonly viewNumber: number;
  readonly validatorIndex: number;
  readonly blockIndex: number;
}

export interface ConsensusMessageBaseAddWithType extends ConsensusMessageBaseAdd {
  readonly type: ConsensusMessageType;
}

export class ConsensusMessageBase implements SerializableWire {
  public static readonly VERSION = 0;
  public static readonly deserializeConsensusMessageBaseWireBase = ({ reader }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const blockIndex = reader.readUInt32LE();
    const validatorIndex = reader.readUInt8();
    const viewNumber = reader.readUInt8();

    return {
      type,
      viewNumber,
      blockIndex,
      validatorIndex,
    };
  };

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): ConsensusMessageBase {
    throw new Error('ConsensusMessageBase deserializeWireBase not implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): ConsensusMessageBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: ConsensusMessageType;
  public readonly viewNumber: number;
  public readonly blockIndex: number;
  public readonly validatorIndex: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, viewNumber, blockIndex, validatorIndex }: ConsensusMessageBaseAddWithType) {
    this.type = type;
    this.viewNumber = viewNumber;
    this.blockIndex = blockIndex;
    this.validatorIndex = validatorIndex;
  }

  public verify(protocolSettings: ProtocolSettings): boolean {
    return this.validatorIndex < protocolSettings.validatorsCount;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt8(this.validatorIndex);
    writer.writeUInt8(this.viewNumber);
  }
}
