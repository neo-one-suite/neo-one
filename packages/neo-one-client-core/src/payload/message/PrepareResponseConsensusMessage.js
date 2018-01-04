/* @flow */
import { CONSENSUS_MESSAGE_TYPE } from './ConsensusMessageType';
import { type BinaryWriter } from '../../utils';
import ConsensusMessageBase, {
  type ConsensusMessageBaseAdd,
} from './ConsensusMessageBase';
import { type DeserializeWireBaseOptions } from '../../Serializable';

export type PrepareResponseAdd = {|
  ...ConsensusMessageBaseAdd,
  signature: Buffer,
|};

export default class PrepareResponseConsensusMessage extends ConsensusMessageBase<
  PrepareResponseConsensusMessage,
  typeof CONSENSUS_MESSAGE_TYPE.PREPARE_RESPONSE,
> {
  signature: Buffer;

  constructor({ viewNumber, signature }: PrepareResponseAdd) {
    super({
      type: CONSENSUS_MESSAGE_TYPE.PREPARE_RESPONSE,
      viewNumber,
    });
    this.signature = signature;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(this.signature);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const message = super.deserializeConsensusMessageBaseWireBase(options);
    const signature = reader.readBytes(64);

    return new this({
      viewNumber: message.viewNumber,
      signature,
    });
  }
}
