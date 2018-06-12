import BN from 'bn.js';
import { Account, AccountKey } from './Account';
import { Asset, AssetKey } from './Asset';
import { BlockBase, BlockBaseJSON } from './BlockBase';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { Header, HeaderKey } from './Header';
import { ScriptContainerType } from './ScriptContainer';
import {
  FeeContext,
  Input,
  Output,
  OutputKey,
  RegisterTransaction,
  Transaction,
  TransactionJSON,
  TransactionType,
  deserializeTransactionWireBase,
} from './transaction';
import { InvalidFormatError, VerifyError } from './errors';
import { Validator } from './Validator';
import { VerifyScript } from './vm';
import { Witness } from './Witness';
import { common, ECPoint, UInt160, UInt256 } from './common';
import { crypto, MerkleTree } from './crypto';
import { utils, BinaryReader, BinaryWriter, IOHelper } from './utils';

export interface BlockAdd {
  version?: number;
  previousHash: UInt256;
  merkleRoot?: UInt256;
  timestamp: number;
  index: number;
  consensusData: BN;
  nextConsensus: UInt160;
  script?: Witness;
  hash?: UInt256;
  transactions: Transaction[];
}

export interface BlockKey {
  hashOrIndex: UInt256 | number;
}

export interface BlockVerifyOptions {
  genesisBlock: Block;
  tryGetBlock: (block: BlockKey) => Promise<Block | null>;
  tryGetHeader: (header: HeaderKey) => Promise<Header | null>;
  isSpent: (key: OutputKey) => Promise<boolean>;
  getAsset: (key: AssetKey) => Promise<Asset>;
  getOutput: (key: OutputKey) => Promise<Output>;
  tryGetAccount: (key: AccountKey) => Promise<Account | null>;
  getValidators: (transactions: Transaction[]) => Promise<ECPoint[]>;
  standbyValidators: ECPoint[];
  getAllValidators: () => Promise<Validator[]>;
  calculateClaimAmount: (inputs: Input[]) => Promise<BN>;
  verifyScript: VerifyScript;
  currentHeight: number;
  governingToken: RegisterTransaction;
  utilityToken: RegisterTransaction;
  fees: { [K in TransactionType]?: BN };
  registerValidatorFee: BN;
  completely?: boolean;
}

export interface BlockJSON extends BlockBaseJSON {
  tx: TransactionJSON[];
}

export class Block extends BlockBase
  implements SerializableWire<Block>, SerializableJSON<BlockJSON> {
  public static async calculateNetworkFee(
    context: FeeContext,
    transactions: Transaction[],
  ): Promise<BN> {
    const fees = await Promise.all(
      transactions.map((transaction) => transaction.getNetworkFee(context)),
    );

    return fees.reduce((acc, fee) => acc.add(fee), utils.ZERO);
  }

  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): Block {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    const transactions = reader.readArray(
      () => deserializeTransactionWireBase(options),
      0x10000,
    );

    if (transactions.length === 0) {
      throw new InvalidFormatError();
    }

    const merkleRoot = MerkleTree.computeRoot(
      transactions.map((transaction) => transaction.hash),
    );

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

  public readonly transactions: Transaction[];
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

  constructor({
    version,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    script,
    hash,
    transactions,
  }: BlockAdd) {
    super({
      version,
      previousHash,
      merkleRoot:
        merkleRoot ||
        MerkleTree.computeRoot(
          transactions.map((transaction) => transaction.hash),
        ),

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
    transactions: Transaction[];
    script: Witness;
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
    return this.transactions.reduce(
      (acc, transaction) => acc.add(transaction.getSystemFee(context)),
      utils.ZERO,
    );
  }

  public async verify(options: BlockVerifyOptions): Promise<void> {
    const { completely = false } = options;

    if (
      this.transactions.length === 0 ||
      this.transactions[0].type !== TransactionType.Miner ||
      this.transactions
        .slice(1)
        .some((transaction) => transaction.type === TransactionType.Miner)
    ) {
      throw new VerifyError('Invalid miner transaction in block.');
    }

    await Promise.all([
      this.verifyBase(options),
      completely ? this.verifyComplete(options) : Promise.resolve(),
    ]);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.transactions, (transaction) =>
      transaction.serializeWireBase(writer),
    );
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<BlockJSON> {
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
          (transaction) =>
            transaction.serializeJSON(context) as
              | TransactionJSON
              | PromiseLike<TransactionJSON>,
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
    if (existingBlock != null) {
      return;
    }

    const previousHeader = await tryGetHeader({
      hashOrIndex: this.previousHash,
    });

    if (previousHeader == null) {
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

  private async verifyConsensus({
    getValidators,
  }: BlockVerifyOptions): Promise<void> {
    const validators = await getValidators(this.transactions);
    if (
      !common.uInt160Equal(
        this.nextConsensus,
        crypto.getConsensusAddress(validators),
      )
    ) {
      throw new VerifyError('Invalid next consensus address');
    }
  }

  private async verifyTransactions(options: BlockVerifyOptions): Promise<void> {
    await Promise.all(
      this.transactions.map((transaction) =>
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

    const minerTransaction = this.transactions.find(
      (transaction) => transaction.type === TransactionType.Miner,
    );

    if (minerTransaction == null) {
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
