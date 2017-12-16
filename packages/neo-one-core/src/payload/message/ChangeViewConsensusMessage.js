/* @flow */
import { CONSENSUS_MESSAGE_TYPE } from './ConsensusMessageType';
import { type BinaryWriter } from '../../utils';
import ConsensusMessageBase, {
  type ConsensusMessageBaseAdd,
} from './ConsensusMessageBase';
import { type DeserializeWireBaseOptions } from '../../Serializable';
import { InvalidFormatError } from '../../errors';

export type ChangeViewAdd = {|
  ...ConsensusMessageBaseAdd,
  newViewNumber: number,
|};

export default class ChangeViewConsensusMessage extends ConsensusMessageBase<
  ChangeViewConsensusMessage,
  typeof CONSENSUS_MESSAGE_TYPE.CHANGE_VIEW,
> {
  newViewNumber: number;

  constructor({ viewNumber, newViewNumber }: ChangeViewAdd) {
    super({
      type: CONSENSUS_MESSAGE_TYPE.CHANGE_VIEW,
      viewNumber,
    });
    this.newViewNumber = newViewNumber;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(this.newViewNumber);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
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
}
