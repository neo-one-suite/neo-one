import {
  BinaryWriter,
  BlockJSON,
  common,
  InvalidFormatError,
  IOHelper,
  TransactionJSON,
  UInt256,
} from '@neo-one/client-common';
import { BlockBase, BlockBaseAdd } from './BlockBase';
import { ConsensusData } from './ConsensusData';
import { MerkleTree } from './crypto';
import { Header } from './Header';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { Transaction } from './transaction';
import { TrimmedBlock } from './TrimmedBlock';
import { BinaryReader, utils } from './utils';
import { Witness } from './Witness';

export interface BlockAdd extends BlockBaseAdd {
  readonly consensusData?: ConsensusData;
  readonly transactions: readonly Transaction[];
}

export interface BlockKey {
  readonly hashOrIndex: UInt256 | number;
}

// export interface BlockVerifyOptions {
//   readonly genesisBlock: Block;
//   readonly tryGetBlock: (block: BlockKey) => Promise<Block | undefined>;
//   readonly tryGetHeader: (header: HeaderKey) => Promise<Header | undefined>;
//   readonly isSpent: (key: OutputKey) => Promise<boolean>;
//   readonly getAsset: (key: AssetKey) => Promise<Asset>;
//   readonly getOutput: (key: OutputKey) => Promise<Output>;
//   readonly tryGetAccount: (key: AccountKey) => Promise<Account | undefined>;
//   readonly getValidators: (transactions: readonly Transaction[]) => Promise<readonly ECPoint[]>;
//   readonly standbyValidators: readonly ECPoint[];
//   readonly getAllValidators: () => Promise<readonly Validator[]>;
//   readonly calculateClaimAmount: (inputs: readonly Input[]) => Promise<BN>;
//   readonly verifyScript: VerifyScript;
//   readonly currentHeight: number;
//   readonly governingToken: RegisterTransaction;
//   readonly utilityToken: RegisterTransaction;
//   readonly fees: { [K in TransactionType]?: BN };
//   readonly registerValidatorFee: BN;
//   readonly completely?: boolean;
// }

type TransactionOrConsensusData = Transaction | ConsensusData;
const getCombinedModels = (
  transactions: readonly Transaction[],
  consensusData?: ConsensusData,
): readonly TransactionOrConsensusData[] => {
  const init: TransactionOrConsensusData[] = consensusData ? [consensusData] : [];

  return init.concat(transactions);
};

export class Block extends BlockBase implements SerializableWire<Block>, SerializableJSON<BlockJSON> {
  public static readonly MaxContentsPerBlock = utils.USHORT_MAX;
  public static readonly MaxTransactionsPerBlock = utils.USHORT_MAX.subn(1);
  // public static async calculateNetworkFee(context: FeeContext, transactions: readonly Transaction[]): Promise<BN> {
  //   const fees = await Promise.all(transactions.map(async (transaction) => transaction.getNetworkFee(context)));

  //   return fees.reduce((acc, fee) => acc.add(fee), utils.ZERO);
  // }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): Block {
    const { reader } = options;
    const blockBase = super.deserializeWireBase(options);
    const count = reader.readVarUIntLE(this.MaxContentsPerBlock).toNumber();
    if (count === 0) {
      throw new InvalidFormatError('Expected count to be greater than 0');
    }
    const consensusData = ConsensusData.deserializeWireBase(options);
    const transactions = reader.readArray(() => Transaction.deserializeWireBase(options), 0x10000);

    if (transactions.length !== count - 1) {
      throw new InvalidFormatError(`Expected ${count - 1} transactions on the block, found: ${transactions.length}`);
    }

    const merkleRoot = MerkleTree.computeRoot(
      [consensusData.hash].concat(transactions.map((transaction) => transaction.hash)),
    );

    if (!common.uInt256Equal(merkleRoot, blockBase.merkleRoot)) {
      throw new InvalidFormatError('Invalid merkle root');
    }

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      consensusData,
      nextConsensus: blockBase.nextConsensus,
      witness: blockBase.witness,
      transactions,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Block {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly transactions: readonly Transaction[];
  public readonly consensusData?: ConsensusData;
  protected readonly sizeExclusive = utils.lazy(() =>
    IOHelper.sizeOfArray(getCombinedModels(this.transactions, this.consensusData), (model) => model.size),
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

  private readonly allHashesInternal = utils.lazy(() =>
    getCombinedModels(this.transactions, this.consensusData).map((model) => model.hash),
  );

  public constructor({
    version,
    previousHash,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    witness,
    hash,
    transactions,
    merkleRoot = MerkleTree.computeRoot(getCombinedModels(transactions, consensusData).map((model) => model.hash)),
  }: BlockAdd) {
    super({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
      hash,
    });

    this.transactions = transactions;
    this.consensusData = consensusData;
  }

  public get header(): Header {
    return this.headerInternal();
  }

  public get allHashes(): readonly UInt256[] {
    return this.allHashesInternal();
  }

  public clone({
    transactions,
    witness,
  }: {
    readonly transactions: readonly Transaction[];
    readonly witness: Witness;
  }): Block {
    return new Block({
      version: this.version,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      index: this.index,
      consensusData: this.consensusData,
      nextConsensus: this.nextConsensus,
      transactions,
      witness,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(getCombinedModels(this.transactions, this.consensusData), (model) =>
      model.serializeWireBase(writer),
    );
  }

  public serializeJSON(context: SerializeJSONContext): BlockJSON {
    const blockBaseJSON = super.serializeJSON(context);

    return {
      ...blockBaseJSON,
      consensusdata: this.consensusData ? this.consensusData.serializeJSON() : undefined,
      tx: this.transactions.map((transaction) => transaction.serializeJSON(context) as TransactionJSON),
      // confirmations: blockBaseJSON.confirmations, TODO: is this our own property?
    };
  }

  public trim(): TrimmedBlock {
    return new TrimmedBlock({
      version: this.version,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      index: this.index,
      nextConsensus: this.nextConsensus,
      witness: this.witness,
      hashes: this.allHashes,
      consensusData: this.consensusData,
    });
  }
}
