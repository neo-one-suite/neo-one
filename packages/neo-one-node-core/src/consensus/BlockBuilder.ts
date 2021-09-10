import {
  BlockJSON,
  JSONHelper,
  scriptHashToAddress,
  TransactionJSON,
  UInt160,
  UInt256,
  utils,
} from '@neo-one/client-common';
import { OmitStrict } from '@neo-one/utils';
import { BN } from 'bn.js';
import { Block, BlockAdd } from '../Block';
import { Header, HeaderAdd } from '../Header';
import { Transaction } from '../transaction';
import { Witness } from '../Witness';

export interface BlockPartial extends Partial<BlockAdd>, Partial<HeaderAdd> {}

export class BlockBuilder {
  public readonly merkleRoot?: UInt256;
  public readonly transactions?: readonly Transaction[];
  public readonly version?: number;
  public readonly previousHash?: UInt256;
  public readonly timestamp?: BN;
  public readonly nonce?: BN;
  public readonly index?: number;
  public readonly primaryIndex?: number;
  public readonly nextConsensus?: UInt160;
  public readonly witness?: Witness;
  public readonly hash?: UInt256;
  public readonly network?: number;

  public constructor(options: BlockPartial) {
    this.merkleRoot = options.merkleRoot;
    this.transactions = options.transactions;
    this.version = options.version;
    this.previousHash = options.previousHash;
    this.timestamp = options.timestamp;
    this.nonce = options.nonce;
    this.primaryIndex = options.primaryIndex;
    this.index = options.index;
    this.nextConsensus = options.nextConsensus;
    this.witness = options.witness;
    this.hash = options.hash;
    this.network = options.network;
  }

  public clone({
    merkleRoot,
    transactions,
    version,
    previousHash,
    timestamp,
    nonce,
    primaryIndex,
    index,
    nextConsensus,
    witness,
    hash,
  }: BlockPartial) {
    return new BlockBuilder({
      merkleRoot: merkleRoot ?? this.merkleRoot,
      transactions: transactions ?? this.transactions,
      version: version ?? this.version,
      previousHash: previousHash ?? this.previousHash,
      timestamp: timestamp ?? this.timestamp,
      nonce: nonce ?? this.nonce,
      primaryIndex: primaryIndex ?? this.primaryIndex,
      index: index ?? this.index,
      nextConsensus: nextConsensus ?? this.nextConsensus,
      witness: witness ?? this.witness,
      hash: hash ?? this.hash,
    });
  }

  public getBlock() {
    // TODO: we could assert all these options but we'd throw anyway, maybe clean up.
    return new Block({
      transactions: this.transactions ?? [],
      header: new Header({
        version: this.version,
        previousHash: this.previousHash,
        merkleRoot: this.merkleRoot,
        timestamp: this.timestamp,
        nonce: this.nonce,
        index: this.index,
        primaryIndex: this.primaryIndex,
        nextConsensus: this.nextConsensus,
        witness: this.witness,
        network: this.network,
        // tslint:disable-next-line: no-any
      } as any),
    });
  }

  public toJSON(): Partial<OmitStrict<BlockJSON, 'tx'> & { readonly tx: ReadonlyArray<TransactionJSON> }> {
    return {
      merkleroot: this.merkleRoot ? JSONHelper.writeUInt256(this.merkleRoot) : undefined,
      tx: this.transactions?.map((tx) => tx.serializeJSON()),
      version: this.version,
      previousblockhash: this.previousHash ? JSONHelper.writeUInt256(this.previousHash) : undefined,
      time: this.timestamp?.toString(),
      timeseconds: this.timestamp?.divn(1000).toNumber(),
      nonce: this.nonce === undefined ? undefined : utils.toPaddedHexString(this.nonce, 16),
      index: this.index,
      primary: this.primaryIndex,
      nextconsensus: this.nextConsensus ? scriptHashToAddress(JSONHelper.writeUInt160(this.nextConsensus)) : undefined,
      witnesses: this.witness ? [this.witness.serializeJSON()] : undefined,
      hash: this.hash ? JSONHelper.writeUInt256(this.hash) : undefined,
    };
  }
}
