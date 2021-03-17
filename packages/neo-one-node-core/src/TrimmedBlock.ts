import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
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
import { NotSupportedError } from './errors';
import { Header } from './Header';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializeJSONContext } from './Serializable';
import { StackItem } from './StackItems';
import { utils } from './utils';

export interface TrimmedBlockAdd extends BlockBaseAdd {
  readonly consensusData?: ConsensusData;
  readonly hashes: readonly UInt256[];
}

export interface BlockKey {
  readonly hashOrIndex: UInt256 | number;
}

export class TrimmedBlock extends BlockBase implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): TrimmedBlock {
    const { reader } = options;
    const { version, previousHash, merkleRoot, timestamp, index, nextConsensus, witness } = super.deserializeWireBase(
      options,
    );

    const hashes = reader.readArray(() => reader.readUInt256(), Block.MaxContentsPerBlock);
    const consensusData = hashes.length > 0 ? ConsensusData.deserializeWireBase(options) : undefined;

    return new TrimmedBlock({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
      hashes,
      consensusData,
      messageMagic: options.context.messageMagic,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static fromStackItem(_stackItem: StackItem) {
    throw new NotSupportedError('fromStackItem');
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned = createSerializeWire(super.serializeUnsignedBase.bind(this));
  public readonly consensusData?: ConsensusData;
  public readonly hashes: readonly UInt256[];
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
        messageMagic: this.messageMagic,
      }),
  );

  public constructor({
    version,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    nextConsensus,
    witness,
    hash,
    consensusData,
    hashes,
    messageMagic,
  }: TrimmedBlockAdd) {
    super({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
      hash,
      messageMagic,
    });
    this.consensusData = consensusData;
    this.hashes = hashes;
  }

  public get header() {
    return this.headerInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.hashes, writer.writeUInt256.bind(writer));
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
