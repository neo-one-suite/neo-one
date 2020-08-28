import {
  BinaryWriter,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  SerializableWire,
  TrimmedBlockJSON,
  UInt256,
} from '@neo-one/client-common';
import { Block } from './Block';
import { BlockBase, BlockBaseAdd } from './BlockBase';
import { ConsensusData } from './ConsensusData';
import { Header } from './Header';
import { DeserializeWireBaseOptions, SerializeJSONContext } from './Serializable';
import { ReadStorage } from './Storage';
import { TransactionKey, TransactionState } from './transaction';
import { utils } from './utils';

export interface TrimmedBlockAdd extends BlockBaseAdd {
  readonly consensusData?: ConsensusData;
  readonly hashes: readonly UInt256[];
}

export type BlockKey = UInt256;

export class TrimmedBlock extends BlockBase implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): TrimmedBlock {
    const {
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
    } = BlockBase.deserializeWireBase(options);
    const { reader } = options;

    const hashes = reader.readArray(reader.readUInt256, Block.MaxContentsPerBlock);
    const consensusData = hashes.length > 0 ? ConsensusData.deserializeWireBase(options) : undefined;

    return new this({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
      hashes,
      consensusData,
    });
  }

  public readonly consensusData?: ConsensusData;
  public readonly hashes: readonly UInt256[];
  public readonly isBlock: boolean;
  protected readonly sizeExclusive = utils.lazy(
    () =>
      IOHelper.sizeOfArray(this.hashes, () => IOHelper.sizeOfUInt256) +
      (this.consensusData ? this.consensusData.size : 0),
  );
  private readonly headerInternal = utils.lazy(
    () =>
      new Header({
        version: this.version,
        previousHash: this.previousHash,
        merkleRoot: this.merkleRoot,
        timestamp: this.timestamp,
        index: this.index,
        nextConsensus: this.nextConsensus,
        witness: this.witness,
      }),
  );

  public constructor(options: TrimmedBlockAdd) {
    super(options);
    this.consensusData = options.consensusData;
    this.hashes = options.hashes;
    this.isBlock = this.hashes.length > 0;
  }

  public get header() {
    return this.headerInternal();
  }

  public async getBlock(storage: ReadStorage<TransactionKey, TransactionState>) {
    return new Block({
      version: this.version,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      index: this.index,
      nextConsensus: this.nextConsensus,
      witness: this.witness,
      consensusData: this.consensusData,
      transactions: await Promise.all(
        this.hashes.slice(1).map(async (hash) => {
          const state = await storage.get(hash);

          return state.transaction;
        }),
      ),
    });
  }

  // TODO: review this
  public clone(options: Partial<TrimmedBlockAdd>): TrimmedBlock {
    return new TrimmedBlock({
      version: this.version,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      index: this.index,
      nextConsensus: this.nextConsensus,
      witness: this.witness,
      hashes: this.hashes,
      consensusData: this.consensusData,
      ...options,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.hashes, writer.writeUInt256);
    if (this.hashes.length > 0) {
      if (this.consensusData === undefined) {
        throw new InvalidFormatError(
          `Invalid TrimmedBlock, consensusData must be present if hashes > 0, found: ${this.hashes.length}`,
        );
      }
      this.consensusData.serializeWireBase(writer);
    }
  }

  public serializeJSON(context: SerializeJSONContext): TrimmedBlockJSON {
    const json = super.serializeJSON(context);

    return {
      ...json,
      consensusdata: this.consensusData ? this.consensusData.serializeJSON() : undefined,
      hashes: this.hashes.map((hash) => JSONHelper.writeUInt256(hash)),
    };
  }
}
