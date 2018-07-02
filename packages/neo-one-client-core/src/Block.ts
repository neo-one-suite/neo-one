import { BN } from 'bn.js';
import { Account, AccountKey } from './Account';
import { Asset, AssetKey } from './Asset';
import { BlockBase, BlockBaseJSON } from './BlockBase';
import { common, ECPoint, UInt160, UInt256 } from './common';
import { crypto, MerkleTree } from './crypto';
import { InvalidFormatError, VerifyError } from './errors';
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
  TransactionJSON,
  TransactionType,
} from './transaction';
import { BinaryReader, BinaryWriter, IOHelper, utils } from './utils';
import { Validator } from './Validator';
import { VerifyScript } from './vm';
import { Witness } from './Witness';

export interface BlockAdd {
  readonly version?: number;
  readonly previousHash: UInt256;
  readonly merkleRoot?: UInt256;
  readonly timestamp: number;
  readonly index: number;
  readonly consensusData: BN;
  readonly nextConsensus: UInt160;
  readonly script?: Witness;
  readonly hash?: UInt256;
  readonly transactions: ReadonlyArray<Transaction>;
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
  readonly getValidators: (transactions: ReadonlyArray<Transaction>) => Promise<ReadonlyArray<ECPoint>>;
  readonly standbyValidators: ReadonlyArray<ECPoint>;
  readonly getAllValidators: () => Promise<ReadonlyArray<Validator>>;
  readonly calculateClaimAmount: (inputs: ReadonlyArray<Input>) => Promise<BN>;
  readonly verifyScript: VerifyScript;
  readonly currentHeight: number;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
  readonly completely?: boolean;
}

export interface BlockJSON extends BlockBaseJSON {
  readonly tx: ReadonlyArray<TransactionJSON>;
}

export class Block extends BlockBase implements SerializableWire<Block>, SerializableJSON<BlockJSON> {
  public static async calculateNetworkFee(context: FeeContext, transactions: ReadonlyArray<Transaction>): Promise<BN> {
    const fees = await Promise.all(transactions.map(async (transaction) => transaction.getNetworkFee(context)));

    return fees.reduce((acc, fee) => acc.add(fee), utils.ZERO);
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): Block {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    const transactions = reader.readArray(() => deserializeTransactionWireBase(options), 0x10000);

    if (transactions.length === 0) {
      throw new InvalidFormatError();
    }

    const merkleRoot = MerkleTree.computeRoot(transactions.map((transaction) => transaction.hash));

    if (!common.uInt256Equal(merkleRoot, blockBase.merkleRoot)) {
      throw new InvalidFormatError();
    }

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      consensusData: blockBase.consensusData,
      nextConsensus: blockBase.nextConsensus,
      script: blockBase.script,
      transactions,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Block {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly transactions: ReadonlyArray<Transaction>;
  protected readonly sizeExclusive = utils.lazy(() =>
    IOHelper.sizeOfArray(this.transactions, (transaction) => transaction.size),
  );
  private readonly headerInternal = utils.lazy(
    () =>
      new Header({
        version: this.version,
        previousHash: this.previousHash,
        merkleRoot: this.merkleRoot,
        timestamp: this.timestamp,
        index: this.index,
        consensusData: this.consensusData,
        nextConsensus: this.nextConsensus,
        script: this.script,
      }),
  );

  public constructor({
    version,
    previousHash,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    script,
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
      consensusData,
      nextConsensus,
      script,
      hash,
    });

    this.transactions = transactions;
  }

  public get header(): Header {
    return this.headerInternal();
  }

  public clone({
    transactions,
    script,
  }: {
    readonly transactions: ReadonlyArray<Transaction>;
    readonly script: Witness;
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
      script,
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
      nonce: blockBaseJSON.nonce,
      nextconsensus: blockBaseJSON.nextconsensus,
      script: blockBaseJSON.script,
      tx: await Promise.all(
        this.transactions.map(
          (transaction) => transaction.serializeJSON(context) as TransactionJSON | PromiseLike<TransactionJSON>,
        ),
      ),
      size: blockBaseJSON.size,
      confirmations: blockBaseJSON.confirmations,
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

    await verifyScript({
      scriptContainer: { type: ScriptContainerType.Block, value: this },
      hash: previousHeader.nextConsensus,
      witness: this.script,
    });
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
    await Promise.all(
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
