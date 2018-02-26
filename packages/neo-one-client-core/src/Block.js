/* @fl/* @flow */
import type BN from 'bn.js';

import type Account, { AccountKey } from './Account';
import type Asset, { AssetKey } from './Asset';
import BlockBase, { type BlockBaseJSON } from './BlockBase';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableJSON,
  type SerializableWire,
  type SerializeJSONContext,
} from './Serializable';
import Header, { type HeaderKey } from './Header';
import { SCRIPT_CONTAINER_TYPE } from './ScriptContainer';
import {
  TRANSACTION_TYPE,
  type FeeContext,
  type Input,
  type Output,
  type OutputKey,
  type RegisterTransaction,
  type Transaction,
  type TransactionJSON,
  type TransactionType,
  deserializeTransactionWireBase,
} from './transaction';
import { InvalidFormatError, VerifyError } from './errors';
import type Validator from './Validator';
import type { VerifyScript } from './vm';
import type Witness from './Witness';

import common, { type ECPoint, type UInt160, type UInt256 } from './common';
import crypto, { MerkleTree } from './crypto';
import utils, { BinaryReader, type BinaryWriter, IOHelper } from './utils';

export type BlockAdd = {|
  version?: number,
  previousHash: UInt256,
  merkleRoot?: UInt256,
  timestamp: number,
  index: number,
  consensusData: BN,
  nextConsensus: UInt160,
  script?: Witness,
  hash?: UInt256,
  transactions: Array<Transaction>,
|};
export type BlockKey = {|
  hashOrIndex: UInt256 | number,
|};
export type BlockVerifyOptions = {|
  // eslint-disable-next-line
  genesisBlock: Block,
  // eslint-disable-next-line
  tryGetBlock: (block: BlockKey) => Promise<?Block>,
  tryGetHeader: (header: HeaderKey) => Promise<?Header>,
  isSpent: (key: OutputKey) => Promise<boolean>,
  getAsset: (key: AssetKey) => Promise<Asset>,
  getOutput: (key: OutputKey) => Promise<Output>,
  tryGetAccount: (key: AccountKey) => Promise<?Account>,
  getValidators: (transactions: Array<Transaction>) => Promise<Array<ECPoint>>,
  standbyValidators: Array<ECPoint>,
  getAllValidators: () => Promise<Array<Validator>>,
  calculateClaimAmount: (inputs: Array<Input>) => Promise<BN>,
  verifyScript: VerifyScript,
  currentHeight: number,
  governingToken: RegisterTransaction,
  utilityToken: RegisterTransaction,
  fees: { [type: TransactionType]: BN },
  registerValidatorFee: BN,
  completely?: boolean,
|};

export type BlockJSON = {|
  ...BlockBaseJSON,
  tx: Array<TransactionJSON>,
|};

export default class Block extends BlockBase
  implements SerializableWire<Block>, SerializableJSON<BlockJSON> {
  transactions: Array<Transaction>;

  __blockSize: () => number;

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
          transactions.map(transaction => transaction.hash),
        ),
      timestamp,
      index,
      consensusData,
      nextConsensus,
      script,
      hash,
    });
    this.transactions = transactions;
    this.__blockSize = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfArray(
          this.transactions,
          transaction => transaction.size,
        ),
    );
  }

  get size(): number {
    return this.__blockSize();
  }

  _header = utils.lazy(
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

  get header(): Header {
    return this._header();
  }

  clone({
    transactions,
    script,
  }: {|
    transactions: Array<Transaction>,
    script: Witness,
  |}): this {
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

  async getNetworkFee(context: FeeContext): Promise<BN> {
    return this.constructor.calculateNetworkFee(context, this.transactions);
  }

  static async calculateNetworkFee(
    context: FeeContext,
    transactions: Array<Transaction>,
  ): Promise<BN> {
    const fees = await Promise.all(
      transactions.map(transaction => transaction.getNetworkFee(context)),
    );
    return fees.reduce((acc, fee) => acc.add(fee), utils.ZERO);
  }

  getSystemFee(context: FeeContext): BN {
    return this.transactions.reduce(
      (acc, transaction) => acc.add(transaction.getSystemFee(context)),
      utils.ZERO,
    );
  }

  async verify(options: BlockVerifyOptions): Promise<void> {
    const { completely = false } = options;

    if (
      this.transactions.length === 0 ||
      this.transactions[0].type !== TRANSACTION_TYPE.MINER ||
      this.transactions
        .slice(1)
        .some(transaction => transaction.type === TRANSACTION_TYPE.MINER)
    ) {
      throw new VerifyError('Invalid miner transaction in block.');
    }

    await Promise.all([
      this._verifyBase(options),
      completely ? this._verifyComplete(options) : Promise.resolve(),
    ]);
  }

  async _verifyBase({
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
      scriptContainer: { type: SCRIPT_CONTAINER_TYPE.BLOCK, value: this },
      hash: previousHeader.nextConsensus,
      witness: this.script,
    });
  }

  async _verifyComplete(options: BlockVerifyOptions): Promise<void> {
    await Promise.all([
      this._verifyConsensus(options),
      this._verifyTransactions(options),
      this._verifyNetworkFee(options),
    ]);
  }

  async _verifyConsensus({ getValidators }: BlockVerifyOptions): Promise<void> {
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

  async _verifyTransactions(options: BlockVerifyOptions): Promise<void> {
    await Promise.all(
      this.transactions.map(transaction =>
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

  async _verifyNetworkFee(options: BlockVerifyOptions): Promise<void> {
    const networkFee = await this.getNetworkFee({
      getOutput: options.getOutput,
      governingToken: options.governingToken,
      utilityToken: options.utilityToken,
      fees: options.fees,
      registerValidatorFee: options.registerValidatorFee,
    });
    const minerTransaction = this.transactions.find(
      transaction => transaction.type === TRANSACTION_TYPE.MINER,
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

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.transactions, transaction =>
      transaction.serializeWireBase(writer),
    );
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): Block {
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
      transactions.map(transaction => transaction.hash),
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

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  async serializeJSON(context: SerializeJSONContext): Promise<BlockJSON> {
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
          transaction => (transaction.serializeJSON(context): $FlowFixMe),
        ),
      ),
      size: blockBaseJSON.size,
      confirmations: blockBaseJSON.confirmations,
    };
  }
}
