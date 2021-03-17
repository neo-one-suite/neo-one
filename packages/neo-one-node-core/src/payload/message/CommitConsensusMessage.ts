import { BinaryWriter } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface CommitConsensusMessageAdd extends ConsensusMessageBaseAdd {
  readonly signature: Buffer;
}

export class CommitConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): CommitConsensusMessage {
    const { reader } = options;
    const { viewNumber, blockIndex, validatorIndex } = super.deserializeConsensusMessageBaseWireBase(options);
    const signature = reader.readBytes(64);

    return new CommitConsensusMessage({
      viewNumber,
      blockIndex,
      validatorIndex,
      signature,
    });
  }

  public readonly signature: Buffer;

  public constructor({ viewNumber, blockIndex, validatorIndex, signature }: CommitConsensusMessageAdd) {
    const options = {
      type: ConsensusMessageType.Commit,
      viewNumber,
      blockIndex,
      validatorIndex,
    };
    super(options);
    this.signature = signature;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeBytes(this.signature);
  }
}
