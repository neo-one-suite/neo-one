import { BinaryReader, BinaryWriter, IOHelper, UInt160, UInt256 } from '@neo-one/client-common';
import { BaseState } from '@neo-one/client-full-common';
import { BN } from 'bn.js';
import { deserializeExecutionResultWireBase, ExecutionResult } from './executionResult';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from './Serializable';
import { utils } from './utils';

export interface TransactionDataAdd {
  readonly version?: number;
  readonly hash: UInt256;
  readonly blockHash: UInt256;
  readonly globalIndex: BN;
  readonly deployedContractHashes: readonly UInt160[];
  readonly deletedContractHashes: readonly UInt160[];
  readonly updatedContractHashes: readonly UInt160[];
  readonly blockIndex: number;
  readonly transactionIndex: number;
  readonly actionIndexStart: BN;
  readonly actionIndexStop: BN;
  readonly executionResult: ExecutionResult;
}

export interface TransactionDataKey {
  readonly hash: UInt256;
}

export class TransactionData extends BaseState implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): TransactionData {
    const { reader } = options;
    const version = reader.readUInt8();
    const hash = reader.readUInt256();
    const blockHash = reader.readUInt256();
    const blockIndex = reader.readUInt32LE();
    const transactionIndex = reader.readUInt32LE();
    const globalIndex = reader.readUInt64LE();
    const deployedContractHashes = reader.readArray(() => reader.readUInt160());
    const deletedContractHashes = reader.readArray(() => reader.readUInt160());
    const updatedContractHashes = reader.readArray(() => reader.readUInt160());
    const actionIndexStart = reader.readUInt64LE();
    const actionIndexStop = reader.readUInt64LE();
    const executionResult = deserializeExecutionResultWireBase(options);

    return new this({
      version,
      hash,
      blockHash,
      transactionIndex,
      globalIndex,
      blockIndex,
      deployedContractHashes,
      deletedContractHashes,
      updatedContractHashes,
      actionIndexStart,
      actionIndexStop,
      executionResult,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): TransactionData {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly blockHash: UInt256;
  public readonly transactionIndex: number;
  public readonly globalIndex: BN;
  public readonly deletedContractHashes: readonly UInt160[];
  public readonly deployedContractHashes: readonly UInt160[];
  public readonly updatedContractHashes: readonly UInt160[];
  public readonly blockIndex: number;
  public readonly actionIndexStart: BN;
  public readonly actionIndexStop: BN;
  public readonly executionResult: ExecutionResult;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({
    version,
    hash,
    blockHash,
    transactionIndex,
    globalIndex,
    deletedContractHashes,
    deployedContractHashes,
    updatedContractHashes,
    blockIndex,
    actionIndexStart,
    actionIndexStop,
    executionResult,
  }: TransactionDataAdd) {
    super({ version });
    this.hash = hash;
    this.blockHash = blockHash;
    this.transactionIndex = transactionIndex;
    this.globalIndex = globalIndex;
    this.deletedContractHashes = deletedContractHashes;
    this.deployedContractHashes = deployedContractHashes;
    this.updatedContractHashes = updatedContractHashes;
    this.blockIndex = blockIndex;
    this.actionIndexStart = actionIndexStart;
    this.actionIndexStop = actionIndexStop;
    this.executionResult = executionResult;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfUInt64LE +
        IOHelper.sizeOfArray(this.deployedContractHashes, () => IOHelper.sizeOfUInt160) +
        IOHelper.sizeOfArray(this.deletedContractHashes, () => IOHelper.sizeOfUInt160) +
        IOHelper.sizeOfArray(this.updatedContractHashes, () => IOHelper.sizeOfUInt160) +
        this.executionResult.size,
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt256(this.hash);
    writer.writeUInt256(this.blockHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt32LE(this.transactionIndex);
    writer.writeUInt64LE(this.globalIndex);
    writer.writeArray(this.deployedContractHashes, (contractHash) => {
      writer.writeUInt160(contractHash);
    });
    writer.writeArray(this.deletedContractHashes, (contractHash) => {
      writer.writeUInt160(contractHash);
    });
    writer.writeArray(this.updatedContractHashes, (contractHash) => {
      writer.writeUInt160(contractHash);
    });
    writer.writeUInt64LE(this.actionIndexStart);
    writer.writeUInt64LE(this.actionIndexStop);
    this.executionResult.serializeWireBase(writer);
  }
}
