/* @flow */
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from './Serializable';
import { type InvocationResult, deserializeWireBase } from './invocationResult';

import common, { type ECPoint, type UInt160, type UInt256 } from './common';
import utils, { type BinaryWriter, BinaryReader, IOHelper } from './utils';

export type InvocationDataAdd = {|
  hash: UInt256,
  assetHash?: ?UInt256,
  contractHashes: Array<UInt160>,
  deletedContractHashes: Array<UInt160>,
  migratedContractHashes: Array<[UInt160, UInt160]>,
  voteUpdates: Array<[UInt160, Array<ECPoint>]>,
  blockIndex: number,
  transactionIndex: number,
  result: InvocationResult,
|};
export type InvocationDataKey = {|
  hash: UInt256,
|};

export default class InvocationData
  implements SerializableWire<InvocationData> {
  hash: UInt256;
  assetHash: ?UInt256;
  contractHashes: Array<UInt160>;
  deletedContractHashes: Array<UInt160>;
  migratedContractHashes: Array<[UInt160, UInt160]>;
  voteUpdates: Array<[UInt160, Array<ECPoint>]>;
  blockIndex: number;
  transactionIndex: number;
  result: InvocationResult;

  __size: () => number;

  constructor({
    hash,
    assetHash,
    contractHashes,
    deletedContractHashes,
    migratedContractHashes,
    voteUpdates,
    blockIndex,
    transactionIndex,
    result,
  }: InvocationDataAdd) {
    this.hash = hash;
    this.assetHash = assetHash;
    this.contractHashes = contractHashes;
    this.deletedContractHashes = deletedContractHashes;
    this.migratedContractHashes = migratedContractHashes;
    this.voteUpdates = voteUpdates;
    this.blockIndex = blockIndex;
    this.transactionIndex = transactionIndex;
    this.result = result;
    this.__size = utils.lazy(
      () =>
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfArray(
          this.contractHashes,
          () => IOHelper.sizeOfUInt160,
        ) +
        IOHelper.sizeOfArray(
          this.deletedContractHashes,
          () => IOHelper.sizeOfUInt160,
        ) +
        IOHelper.sizeOfArray(
          this.migratedContractHashes,
          () => IOHelper.sizeOfUInt160,
        ) +
        IOHelper.sizeOfArray(
          this.voteUpdates,
          value =>
            IOHelper.sizeOfUInt160 +
            IOHelper.sizeOfArray(value[1], val => IOHelper.sizeOfECPoint(val)),
        ) +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfUInt32LE +
        this.result.size,
    );
  }

  get size(): number {
    return this.__size();
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt256(this.assetHash || common.ZERO_UINT256);
    writer.writeArray(this.contractHashes, contractHash => {
      writer.writeUInt160(contractHash);
    });
    writer.writeArray(this.deletedContractHashes, contractHash => {
      writer.writeUInt160(contractHash);
    });
    writer.writeArray(this.migratedContractHashes, ([from, to]) => {
      writer.writeUInt160(from);
      writer.writeUInt160(to);
    });
    writer.writeArray(this.voteUpdates, ([address, votes]) => {
      writer.writeUInt160(address);
      writer.writeArray(votes, vote => {
        writer.writeECPoint(vote);
      });
    });
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt32LE(this.transactionIndex);
    this.result.serializeWireBase(writer);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): InvocationData {
    const { reader } = options;
    const hash = reader.readUInt256();
    const assetHash = reader.readUInt256();
    const contractHashes = reader.readArray(() => reader.readUInt160());
    const deletedContractHashes = reader.readArray(() => reader.readUInt160());
    const migratedContractHashes = reader.readArray(() => {
      const from = reader.readUInt160();
      const to = reader.readUInt160();
      return [from, to];
    });
    const voteUpdates = reader.readArray(() => {
      const address = reader.readUInt160();
      const votes = reader.readArray(() => reader.readECPoint());
      return [address, votes];
    });
    const blockIndex = reader.readUInt32LE();
    const transactionIndex = reader.readUInt32LE();
    const result = deserializeWireBase(options);
    return new this({
      hash,
      assetHash: common.uInt256Equal(assetHash, common.ZERO_UINT256)
        ? undefined
        : assetHash,
      contractHashes,
      deletedContractHashes,
      migratedContractHashes,
      voteUpdates,
      blockIndex,
      transactionIndex,
      result,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
