import { DeserializeWireBaseOptions } from '../../Serializable';
import { BinaryWriter } from '../../utils';
import {
  ConsensusMessageBase,
  ConsensusMessageBaseAdd,
} from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface PrepareResponseAdd extends ConsensusMessageBaseAdd {
  signature: Buffer;
}

export class PrepareResponseConsensusMessage extends ConsensusMessageBase<
  PrepareResponseConsensusMessage,
  ConsensusMessageType.PrepareResponse
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): PrepareResponseConsensusMessage {
    const { reader } = options;
    const message = super.deserializeConsensusMessageBaseWireBase(options);
    const signature = reader.readBytes(64);

    return new this({
      viewNumber: message.viewNumber,
      signature,
    });
  }

  public readonly signature: Buffer;

  constructor({ viewNumber, signature }: PrepareResponseAdd) {
    super({
      type: ConsensusMessageType.PrepareResponse,
      viewNumber,
    });

    this.signature = signature;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(this.signature);
  }
}
