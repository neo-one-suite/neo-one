import { BinaryWriter, UInt256 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface PrepareResponseAdd extends ConsensusMessageBaseAdd {
  readonly preparationHash: UInt256;
}

export class PrepareResponseConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PrepareResponseConsensusMessage {
    const { reader } = options;
    const { viewNumber } = super.deserializeConsensusMessageBaseWireBase(options);
    const preparationHash = reader.readUInt256();

    return new this({
      viewNumber,
      preparationHash,
    });
  }

  public readonly preparationHash: UInt256;

  public constructor({ viewNumber, preparationHash }: PrepareResponseAdd) {
    const options = {
      type: ConsensusMessageType.PrepareResponse,
      viewNumber,
    };
    super(options);

    this.preparationHash = preparationHash;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.preparationHash);
  }
}
