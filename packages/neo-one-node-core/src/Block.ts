import {
  BinaryReader,
  BinaryWriter,
  BlockJSON,
  common,
  createSerializeWire,
  getSignData,
  InvalidFormatError,
  IOHelper,
  UInt160,
  UInt256,
  UInt256Hex,
  utils as clientCommonUtils,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Set } from 'immutable';
import { MerkleTree } from './crypto';
import { NotSupportedError } from './errors';
import { Header } from './Header';
import { NativeContainer } from './Native';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
  SerializableJSON,
  SerializeJSONContext,
} from './Serializable';
import { BlockchainStorage } from './Storage';
import { Transaction } from './transaction';
import { utils } from './utils';
import { VerifyOptions } from './Verifiable';
import { Witness } from './Witness';

export interface BlockAdd {
  readonly header: Header;
  readonly transactions: readonly Transaction[];
}

export class Block implements SerializableContainer, SerializableJSON<BlockJSON> {
  public static deserializeUnsignedWireBase(_options: DeserializeWireBaseOptions): Block {
    throw new NotSupportedError('Cannot deserialize unsigned Block');
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Block {
    const { reader } = options;
    const header = Header.deserializeWireBase(options);
    const transactions = reader.readArray(
      () => Transaction.deserializeWireBase(options),
      clientCommonUtils.USHORT_MAX_NUMBER,
    );

    if (Set(transactions).size !== transactions.length) {
      throw new InvalidFormatError(`Expected every transaction in block to be distinct`);
    }

    const merkleRoot = MerkleTree.computeRoot(transactions.map((transaction) => transaction.hash));

    if (!common.uInt256Equal(merkleRoot, header.merkleRoot)) {
      throw new InvalidFormatError('Invalid merkle root');
    }

    return new Block({
      header,
      transactions,
    });
  }

  public static deserializeUnsignedWire(options: DeserializeWireOptions): Block {
    return this.deserializeUnsignedWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Block {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: SerializableContainerType = 'Block';
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned = createSerializeWire(this.serializeWireBaseUnsigned.bind(this));
  public readonly transactions: readonly Transaction[];
  public readonly header: Header;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly sizeInternal = utils.lazy(
    () => this.header.size + IOHelper.sizeOfArray(this.transactions, (tx) => tx.size),
  );
  private readonly messageInternal = utils.lazy(() => getSignData(this.hash, this.network));

  public constructor({ header, transactions }: BlockAdd) {
    this.header = header;
    this.transactions = transactions;
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public get network(): number {
    return this.header.network;
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public get hash(): UInt256 {
    return this.header.hash;
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get version(): number {
    return this.header.version;
  }

  public get previousHash(): UInt256 {
    return this.header.previousHash;
  }

  public get merkleRoot(): UInt256 {
    return this.header.merkleRoot;
  }

  public get timestamp(): BN {
    return this.header.timestamp;
  }

  public get nonce(): BN {
    return this.header.nonce;
  }

  public get index(): number {
    return this.header.index;
  }

  public get primaryIndex(): number {
    return this.header.primaryIndex;
  }

  public get nextConsensus(): UInt160 {
    return this.header.nextConsensus;
  }

  public get witnesses(): readonly Witness[] {
    return this.header.witnesses;
  }

  public async verify(options: VerifyOptions) {
    return this.header.verify(options);
  }

  public async getScriptHashesForVerifying(context: {
    readonly storage: BlockchainStorage;
    readonly native: NativeContainer;
  }) {
    return this.header.getScriptHashesForVerifying(context);
  }

  public serializeWireBaseUnsigned(writer: BinaryWriter): void {
    this.header.serializeWireUnsignedBase(writer);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.header.serializeWireBase(writer);
    writer.writeArray(this.transactions, (tx) => tx.serializeWireBase(writer));
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<BlockJSON> {
    return {
      ...this.header.serializeJSON(context),
      size: this.size,
      tx: await Promise.all(this.transactions.map(async (tx) => tx.serializeJSONWithData(context))),
    };
  }
}
