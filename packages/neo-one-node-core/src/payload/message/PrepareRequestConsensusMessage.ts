import { BinaryWriter, UInt256, utils } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { ProtocolSettings } from '../../Settings';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';

export interface PrepareRequestConsensusMessageAdd extends ConsensusMessageBaseAdd {
  readonly timestamp: BN;
  readonly nonce: BN;
  readonly transactionHashes: readonly UInt256[];
  readonly version: number;
  readonly prevHash: UInt256;
}

export class PrepareRequestConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PrepareRequestConsensusMessage {
    const { reader } = options;
    const { viewNumber, blockIndex, validatorIndex } = super.deserializeConsensusMessageBaseWireBase(options);
    const version = reader.readUInt32LE();
    const prevHash = reader.readUInt256();
    const timestamp = reader.readUInt64LE();
    const nonce = reader.readUInt64LE();
    const transactionHashes = reader.readArray(reader.readUInt256.bind(reader), utils.USHORT_MAX_NUMBER);

    return new PrepareRequestConsensusMessage({
      viewNumber,
      timestamp,
      nonce,
      transactionHashes,
      validatorIndex,
      blockIndex,
      version,
      prevHash,
    });
  }

  public readonly timestamp: BN;
  public readonly nonce: BN;
  public readonly transactionHashes: readonly UInt256[];
  public readonly version: number;
  public readonly prevHash: UInt256;

  public constructor({
    viewNumber,
    timestamp,
    nonce,
    transactionHashes,
    version,
    prevHash,
    blockIndex,
    validatorIndex,
  }: PrepareRequestConsensusMessageAdd) {
    const options = {
      type: ConsensusMessageType.PrepareRequest,
      viewNumber,
      blockIndex,
      validatorIndex,
    };
    super(options);
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.transactionHashes = transactionHashes;
    this.version = version;
    this.prevHash = prevHash;
  }

  public verify(protocolSettings: ProtocolSettings): boolean {
    if (!super.verify(protocolSettings)) {
      return false;
    }

    return this.transactionHashes.length <= protocolSettings.maxTransactionsPerBlock;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeUInt64LE(this.timestamp);
    writer.writeUInt64LE(this.nonce);
    writer.writeArray(this.transactionHashes, writer.writeUInt256.bind(writer));
  }
}
