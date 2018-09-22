import { BinaryWriter } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface PrepareResponseAdd extends ConsensusMessageBaseAdd {
  readonly signature: Buffer;
}

export class PrepareResponseConsensusMessage extends ConsensusMessageBase<
  PrepareResponseConsensusMessage,
  ConsensusMessageType.PrepareResponse
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PrepareResponseConsensusMessage {
    const { reader } = options;
    const message = super.deserializeConsensusMessageBaseWireBase(options);
    const signature = reader.readBytes(64);

    return new this({
      viewNumber: message.viewNumber,
      signature,
    });
  }

  public readonly signature: Buffer;

  public constructor({ viewNumber, signature }: PrepareResponseAdd) {
    const options = {
      // tslint:disable-next-line no-useless-cast
      type: ConsensusMessageType.PrepareResponse as ConsensusMessageType.PrepareResponse,
      viewNumber,
    };
    super(options);

    this.signature = signature;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(this.signature);
  }
}
