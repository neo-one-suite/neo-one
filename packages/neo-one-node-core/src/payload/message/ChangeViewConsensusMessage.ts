import { BinaryWriter, InvalidFormatError } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
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
      throw new InvalidFormatError(`Expected BinaryReader\'s readUInt8(0) to be 0. Received: ${newViewNumber}`);
    }

    return new this({
      viewNumber: message.viewNumber,
      newViewNumber,
    });
  }

  public readonly newViewNumber: number;

  public constructor({ viewNumber, newViewNumber }: ChangeViewAdd) {
    const options = {
      // tslint:disable-next-line no-useless-cast
      type: ConsensusMessageType.ChangeView as ConsensusMessageType.ChangeView,
      viewNumber,
    };
    super(options);

    this.newViewNumber = newViewNumber;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(this.newViewNumber);
  }
}
