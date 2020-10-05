import { BinaryWriter, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from '../../Block';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface PrepareRequestConsensusMessageAdd extends ConsensusMessageBaseAdd {
  readonly timestamp: BN;
  readonly nonce: BN;
  readonly transactionHashes: readonly UInt256[];
}

export class PrepareRequestConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PrepareRequestConsensusMessage {
    const { reader } = options;
    const { viewNumber } = super.deserializeConsensusMessageBaseWireBase(options);
    const timestamp = reader.readUInt64LE();
    const nonce = reader.readUInt64LE();
    const transactionHashes = reader.readArray(reader.readUInt256.bind(reader), Block.MaxTransactionsPerBlock);

    return new PrepareRequestConsensusMessage({
      viewNumber,
      timestamp,
      nonce,
      transactionHashes,
    });
  }

  public readonly timestamp: BN;
  public readonly nonce: BN;
  public readonly transactionHashes: readonly UInt256[];

  public constructor({ viewNumber, timestamp, nonce, transactionHashes }: PrepareRequestConsensusMessageAdd) {
    const options = {
      type: ConsensusMessageType.PrepareRequest,
      viewNumber,
    };
    super(options);
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.transactionHashes = transactionHashes;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeUInt64LE(this.timestamp);
    writer.writeUInt64LE(this.nonce);
    writer.writeArray(this.transactionHashes, writer.writeUInt256.bind(writer));
  }
}
