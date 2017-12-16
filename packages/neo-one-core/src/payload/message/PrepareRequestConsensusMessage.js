/* @flow */
import type BN from 'bn.js';

import { CONSENSUS_MESSAGE_TYPE } from './ConsensusMessageType';
import { type BinaryWriter } from '../../utils';
import ConsensusMessageBase, {
  type ConsensusMessageBaseAdd,
} from './ConsensusMessageBase';
import { type DeserializeWireBaseOptions } from '../../Serializable';
import { InvalidFormatError } from '../../errors';
import { MinerTransaction } from '../../transaction';

import common, { type UInt160, type UInt256 } from '../../common';

export type PrepareRequestAdd = {|
  ...ConsensusMessageBaseAdd,
  nonce: BN,
  nextConsensus: UInt160,
  transactionHashes: Array<UInt256>,
  minerTransaction: MinerTransaction,
  signature: Buffer,
|};

export default class PrepareRequestConsensusMessage extends ConsensusMessageBase<
  PrepareRequestConsensusMessage,
  typeof CONSENSUS_MESSAGE_TYPE.PREPARE_REQUEST,
> {
  nonce: BN;
  nextConsensus: UInt160;
  transactionHashes: Array<UInt256>;
  minerTransaction: MinerTransaction;
  signature: Buffer;

  constructor({
    viewNumber,
    nonce,
    nextConsensus,
    transactionHashes,
    minerTransaction,
    signature,
  }: PrepareRequestAdd) {
    super({
      type: CONSENSUS_MESSAGE_TYPE.PREPARE_REQUEST,
      viewNumber,
    });
    this.nonce = nonce;
    this.nextConsensus = nextConsensus;
    this.transactionHashes = transactionHashes;
    this.minerTransaction = minerTransaction;
    this.signature = signature;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt64LE(this.nonce);
    writer.writeUInt160(this.nextConsensus);
    writer.writeArray(this.transactionHashes, value => {
      writer.writeUInt256(value);
    });
    this.minerTransaction.serializeWireBase(writer);
    writer.writeBytes(this.signature);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const message = super.deserializeConsensusMessageBaseWireBase(options);
    const nonce = reader.readUInt64LE();
    const nextConsensus = reader.readUInt160();
    const transactionHashes = reader.readArray(() => reader.readUInt256());
    const distinctTransactionHashes = new Set(
      transactionHashes.map(hash => common.uInt256ToString(hash)),
    );
    if (distinctTransactionHashes.size !== transactionHashes.length) {
      throw new InvalidFormatError(
        `Distinct hashes: ${distinctTransactionHashes.size} ` +
          `Transaction hashes: ${transactionHashes.length}`,
      );
    }
    const minerTransaction = MinerTransaction.deserializeWireBase(options);
    if (!common.uInt256Equal(minerTransaction.hash, transactionHashes[0])) {
      throw new InvalidFormatError();
    }
    const signature = reader.readBytes(64);

    return new this({
      viewNumber: message.viewNumber,
      nonce,
      nextConsensus,
      transactionHashes,
      minerTransaction,
      signature,
    });
  }
}
