import { BinaryWriter } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { assertChangeViewReason, ChangeViewReason } from './ChangeViewReason';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface ChangeViewAdd extends ConsensusMessageBaseAdd {
  readonly timestamp: BN;
  readonly reason: ChangeViewReason;
}

export class ChangeViewConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ChangeViewConsensusMessage {
    const { reader } = options;
    const { viewNumber, blockIndex, validatorIndex } = super.deserializeConsensusMessageBaseWireBase(options);
    const timestamp = reader.readUInt64LE();
    const reason = assertChangeViewReason(reader.readUInt8());

    return new ChangeViewConsensusMessage({
      viewNumber,
      blockIndex,
      validatorIndex,
      timestamp,
      reason,
    });
  }

  public readonly newViewNumber: number;
  public readonly timestamp: BN;
  public readonly reason: ChangeViewReason;

  public constructor({ viewNumber, blockIndex, validatorIndex, timestamp, reason }: ChangeViewAdd) {
    const options = {
      type: ConsensusMessageType.ChangeView,
      viewNumber,
      blockIndex,
      validatorIndex,
    };
    super(options);
    this.timestamp = timestamp;
    this.reason = reason;
    this.newViewNumber = viewNumber + 1;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt64LE(this.timestamp);
    writer.writeUInt8(this.reason);
  }
}
