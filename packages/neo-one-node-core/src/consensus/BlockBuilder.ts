import { JSONHelper, UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block, BlockAdd } from '../Block';
import { ConsensusData, ConsensusDataAdd } from '../ConsensusData';
import { Transaction } from '../transaction';
import { Witness } from '../Witness';

export interface BlockPartial extends Omit<Partial<BlockAdd>, 'consensusData'> {
  readonly consensusData?: Partial<ConsensusDataAdd>;
}

export class BlockBuilder {
  public readonly merkleRoot?: UInt256;
  public readonly consensusData?: Partial<ConsensusDataAdd>;
  public readonly transactions?: readonly Transaction[];
  public readonly version?: number;
  public readonly previousHash?: UInt256;
  public readonly timestamp?: BN;
  public readonly index?: number;
  public readonly nextConsensus?: UInt160;
  public readonly witness?: Witness;
  public readonly hash?: UInt256;

  public constructor(options: BlockPartial) {
    this.merkleRoot = options.merkleRoot;
    this.consensusData = options.consensusData;
    this.transactions = options.transactions;
    this.version = options.version;
    this.previousHash = options.previousHash;
    this.timestamp = options.timestamp;
    this.index = options.index;
    this.nextConsensus = options.nextConsensus;
    this.witness = options.witness;
    this.hash = options.hash;
  }

  public clone({
    merkleRoot,
    consensusData,
    transactions,
    version,
    previousHash,
    timestamp,
    index,
    nextConsensus,
    witness,
    hash,
  }: BlockPartial) {
    return new BlockBuilder({
      merkleRoot: merkleRoot ?? this.merkleRoot,
      consensusData: consensusData ?? this.consensusData,
      transactions: transactions ?? this.transactions,
      version: version ?? this.version,
      previousHash: previousHash ?? this.previousHash,
      timestamp: timestamp ?? this.timestamp,
      index: index ?? this.index,
      nextConsensus: nextConsensus ?? this.nextConsensus,
      witness: witness ?? this.witness,
      hash: hash ?? this.hash,
    });
  }

  public getConsensusData() {
    if (this.consensusData === undefined || this.consensusData.primaryIndex === undefined) {
      // TODO: real error
      throw new Error('We need at least primaryIndex');
    }

    return new ConsensusData({
      primaryIndex: this.consensusData.primaryIndex,
      nonce: this.consensusData.nonce ?? new BN(0),
    });
  }

  public getBlock() {
    const options = {
      merkleRoot: this.merkleRoot,
      consensusData: this.getConsensusData(),
      transactions: this.transactions,
      version: this.version,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      index: this.index,
      nextConsensus: this.nextConsensus,
      witness: this.witness,
      hash: this.hash,
    };

    // TODO: we could assert all these options but we'd throw anyway, maybe clean up.
    // tslint:disable-next-line: no-any
    return new Block(options as any);
  }

  public toJSON(): object {
    return {
      merkleRoot: this.merkleRoot ? JSONHelper.writeUInt256(this.merkleRoot) : undefined,
      consensusData: this.consensusData,
      transactions: this.transactions?.map((tx) => tx.serializeJSON()),
      version: this.version,
      previousHash: this.previousHash ? JSONHelper.writeUInt256(this.previousHash) : undefined,
      timestamp: this.timestamp,
      index: this.index,
      nextConsensus: this.nextConsensus ? JSONHelper.writeUInt160(this.nextConsensus) : undefined,
      witness: this.witness ? this.witness.serializeJSON() : undefined,
      hash: this.hash ? JSONHelper.writeUInt256(this.hash) : undefined,
    };
  }
}
