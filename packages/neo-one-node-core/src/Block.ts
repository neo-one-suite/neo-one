import {
  BinaryWriter,
  BlockJSON,
  common,
  crypto,
  ECPoint,
  InvalidFormatError,
  IOHelper,
  TransactionJSON,
  UInt160,
  UInt256,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Account, AccountKey } from './Account';
import { Asset, AssetKey } from './Asset';
import { BlockBase } from './BlockBase';
import { ConsensusData } from './ConsensusData';
import { MerkleTree } from './crypto';
import { VerifyError } from './errors';
import { Header, HeaderKey } from './Header';
import { ScriptContainerType } from './ScriptContainer';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import {
  deserializeTransactionWireBase,
  FeeContext,
  Input,
  Output,
  OutputKey,
  RegisterTransaction,
  Transaction,
  TransactionType,
} from './transaction';
import { BinaryReader, utils } from './utils';
import { Validator } from './Validator';
import { VerifyScript } from './vm';
import { Witness } from './Witness';

export interface BlockAdd {
  readonly version?: number;
  readonly previousHash: UInt256;
  readonly merkleRoot?: UInt256;
  readonly timestamp: BN;
  readonly index: number;
  readonly consensusData: ConsensusData;
  readonly nextConsensus: UInt160;
  readonly witness?: Witness;
  readonly hash?: UInt256;
  readonly transactions: readonly Transaction[];
}

export interface BlockKey {
  readonly hashOrIndex: UInt256 | number;
}

export interface BlockVerifyOptions {
  readonly genesisBlock: Block;
  readonly tryGetBlock: (block: BlockKey) => Promise<Block | undefined>;
  readonly tryGetHeader: (header: HeaderKey) => Promise<Header | undefined>;
  readonly isSpent: (key: OutputKey) => Promise<boolean>;
  readonly getAsset: (key: AssetKey) => Promise<Asset>;
  readonly getOutput: (key: OutputKey) => Promise<Output>;
  readonly tryGetAccount: (key: AccountKey) => Promise<Account | undefined>;
  readonly getValidators: (transactions: readonly Transaction[]) => Promise<readonly ECPoint[]>;
  readonly standbyValidators: readonly ECPoint[];
  readonly getAllValidators: () => Promise<readonly Validator[]>;
  readonly calculateClaimAmount: (inputs: readonly Input[]) => Promise<BN>;
  readonly verifyScript: VerifyScript;
  readonly currentHeight: number;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
  readonly completely?: boolean;
}

export class Block extends BlockBase implements SerializableWire<Block>, SerializableJSON<BlockJSON> {
  public static readonly MaxContentsPerBlock = utils.USHORT_MAX;
  public static readonly MaxTransactionsPerBlock = utils.USHORT_MAX.subn(1);
  public static async calculateNetworkFee(context: FeeContext, transactions: readonly Transaction[]): Promise<BN> {
    const fees = await Promise.all(transactions.map(async (transaction) => transaction.getNetworkFee(context)));

    return fees.reduce((acc, fee) => acc.add(fee), utils.ZERO);
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): Block {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    const count = reader.readVarUIntLE(this.MaxContentsPerBlock).toNumber();
    if (count === 0) {
      throw new InvalidFormatError('Expected count to be greater than 0');
    }
    const consensusData = ConsensusData.deserializeWireBase(options);
    // TODO: check the logic here. This used to be {blockbase + transactionsLength + transactions} now it is {blockBase + transactionsLength + consensusData + transactions}
    const transactions = reader.readArray(() => deserializeTransactionWireBase(options), 0x10000, count);

    if (transactions.length === 0) {
      throw new InvalidFormatError('Expected at least one transaction in the block');
    }

    const merkleRoot = MerkleTree.computeRoot(transactions.map((transaction) => transaction.hash));

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
  public readonly consensusData: ConsensusData;
  protected readonly sizeExclusive = utils.lazy(
    () => IOHelper.sizeOfArray(this.transactions, (transaction) => transaction.size) + this.consensusData.size,
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
    merkleRoot = MerkleTree.computeRoot(transactions.map((transaction) => transaction.hash)),
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

  public async getNetworkFee(context: FeeContext): Promise<BN> {
    return Block.calculateNetworkFee(context, this.transactions);
  }

  public getSystemFee(context: FeeContext): BN {
    return this.transactions.reduce((acc, transaction) => acc.add(transaction.getSystemFee(context)), utils.ZERO);
  }

  public async verify(options: BlockVerifyOptions): Promise<void> {
    const { completely = false } = options;

    if (
      this.transactions.length === 0 ||
      this.transactions[0].type !== TransactionType.Miner ||
      this.transactions.slice(1).some((transaction) => transaction.type === TransactionType.Miner)
    ) {
      throw new VerifyError('Invalid miner transaction in block.');
    }

    await Promise.all([this.verifyBase(options), completely ? this.verifyComplete(options) : Promise.resolve()]);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.transactions, (transaction) => transaction.serializeWireBase(writer));
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<BlockJSON> {
    const blockBaseJSON = super.serializeBlockBaseJSON(context);

    return {
      version: blockBaseJSON.version,
      hash: blockBaseJSON.hash,
      previousblockhash: blockBaseJSON.previousblockhash,
      merkleroot: blockBaseJSON.merkleroot,
      time: blockBaseJSON.time,
      index: blockBaseJSON.index,
      nextconsensus: blockBaseJSON.nextconsensus,
      witnesses: blockBaseJSON.witnesses,
      tx: await Promise.all(
        this.transactions.map(
          (transaction) => transaction.serializeJSON(context) as TransactionJSON | PromiseLike<TransactionJSON>,
        ),
      ),
      size: blockBaseJSON.size,
      consensus_data: this.consensusData.serializeJSON(context),
      // confirmations: blockBaseJSON.confirmations, TODO: is this our own property?
    };
  }

  private async verifyBase({
    genesisBlock,
    tryGetBlock,
    tryGetHeader,
    verifyScript,
  }: BlockVerifyOptions): Promise<void> {
    if (common.uInt256Equal(this.hash, genesisBlock.hash)) {
      return;
    }

    const existingBlock = await tryGetBlock({ hashOrIndex: this.hash });
    if (existingBlock !== undefined) {
      return;
    }

    const previousHeader = await tryGetHeader({
      hashOrIndex: this.previousHash,
    });

    if (previousHeader === undefined) {
      throw new VerifyError('Previous header does not exist.');
    }

    if (previousHeader.index + 1 !== this.index) {
      throw new VerifyError('Previous index + 1 does not match index.');
    }

    if (previousHeader.timestamp >= this.timestamp) {
      throw new VerifyError('Previous timestamp is greater than block.');
    }

    const { failureMessage } = await verifyScript({
      scriptContainer: { type: ScriptContainerType.Block, value: this },
      hash: previousHeader.nextConsensus,
      witness: this.witness,
    });

    if (failureMessage !== undefined) {
      throw new VerifyError(failureMessage);
    }
  }

  private async verifyComplete(options: BlockVerifyOptions): Promise<void> {
    await Promise.all([
      this.verifyConsensus(options),
      this.verifyTransactions(options),
      this.verifyNetworkFee(options),
    ]);
  }

  private async verifyConsensus({ getValidators }: BlockVerifyOptions): Promise<void> {
    const validators = await getValidators(this.transactions);
    if (!common.uInt160Equal(this.nextConsensus, crypto.getConsensusAddress(validators))) {
      throw new VerifyError('Invalid next consensus address');
    }
  }

  private async verifyTransactions(options: BlockVerifyOptions): Promise<void> {
    const results = await Promise.all(
      this.transactions.map(async (transaction) =>
        transaction.verify({
          isSpent: options.isSpent,
          getAsset: options.getAsset,
          getOutput: options.getOutput,
          tryGetAccount: options.tryGetAccount,
          calculateClaimAmount: options.calculateClaimAmount,
          standbyValidators: options.standbyValidators,
          getAllValidators: options.getAllValidators,
          verifyScript: options.verifyScript,
          currentHeight: options.currentHeight,
          governingToken: options.governingToken,
          utilityToken: options.utilityToken,
          fees: options.fees,
          registerValidatorFee: options.registerValidatorFee,
        }),
      ),
    );
    const failureResults = results.filter((verifyResults) =>
      verifyResults.some(({ failureMessage }) => failureMessage !== undefined),
    );
    if (failureResults.length > 0) {
      const failureResult = failureResults[0].find(({ failureMessage }) => failureMessage !== undefined);
      if (failureResult !== undefined && failureResult.failureMessage !== undefined) {
        throw new VerifyError(failureResult.failureMessage);
      }
    }
  }

  private async verifyNetworkFee(options: BlockVerifyOptions): Promise<void> {
    const networkFee = await this.getNetworkFee({
      getOutput: options.getOutput,
      governingToken: options.governingToken,
      utilityToken: options.utilityToken,
      fees: options.fees,
      registerValidatorFee: options.registerValidatorFee,
    });

    const minerTransaction = this.transactions.find((transaction) => transaction.type === TransactionType.Miner);

    if (minerTransaction === undefined) {
      throw new VerifyError('Missing miner transaction');
    }

    const minerTransactionNetworkFee = minerTransaction.outputs.reduce(
      (acc, output) => acc.add(output.value),
      utils.ZERO,
    );

    if (!networkFee.eq(minerTransactionNetworkFee)) {
      throw new VerifyError('Miner output does not equal network fee.');
    }
  }
}
