import { BinaryWriter } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface RecoveryRequestConsensusMessageAdd extends ConsensusMessageBaseAdd {
  readonly timestamp: BN;
}

export class RecoveryRequestConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): RecoveryRequestConsensusMessage {
    const { reader } = options;
    const { viewNumber, blockIndex, validatorIndex } = super.deserializeConsensusMessageBaseWireBase(options);
    const timestamp = reader.readUInt64LE();

    return new RecoveryRequestConsensusMessage({
      viewNumber,
      blockIndex,
      validatorIndex,
      timestamp,
    });
  }

  public readonly timestamp: BN;

  public constructor({ viewNumber, blockIndex, validatorIndex, timestamp }: RecoveryRequestConsensusMessageAdd) {
    const options = {
      type: ConsensusMessageType.RecoveryRequest,
      viewNumber,
      blockIndex,
      validatorIndex,
    };
    super(options);
    this.timestamp = timestamp;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeUInt64LE(this.timestamp);
  }
}
