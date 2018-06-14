import { InvalidFormatError } from '../../errors';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { BinaryWriter } from '../../utils';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface ChangeViewAdd extends ConsensusMessageBaseAdd {
  readonly newViewNumber: number;
}

export class ChangeViewConsensusMessage extends ConsensusMessageBase<
  ChangeViewConsensusMessage,
  ConsensusMessageType.ChangeView
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ChangeViewConsensusMessage {
    const { reader } = options;
    const message = super.deserializeConsensusMessageBaseWireBase(options);
    const newViewNumber = reader.readUInt8();
    if (newViewNumber === 0) {
      throw new InvalidFormatError();
    }

    return new this({
      viewNumber: message.viewNumber,
      newViewNumber,
    });
  }

  public readonly newViewNumber: number;

  public constructor({ viewNumber, newViewNumber }: ChangeViewAdd) {
    super({
      type: ConsensusMessageType.ChangeView,
      viewNumber,
    });

    this.newViewNumber = newViewNumber;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(this.newViewNumber);
  }
}
