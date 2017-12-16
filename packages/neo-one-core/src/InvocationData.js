/* @flow */
import { type BinaryWriter, BinaryReader } from './utils';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from './Serializable';
import { type InvocationResult, deserializeWireBase } from './invocationResult';

import common, { type UInt160, type UInt256 } from './common';

export type InvocationDataAdd = {|
  hash: UInt256,
  assetHash?: ?UInt256,
  contractHashes: Array<UInt160>,
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
  blockIndex: number;
  transactionIndex: number;
  result: InvocationResult;

  constructor({
    hash,
    assetHash,
    contractHashes,
    blockIndex,
    transactionIndex,
    result,
  }: InvocationDataAdd) {
    this.hash = hash;
    this.assetHash = assetHash;
    this.contractHashes = contractHashes;
    this.blockIndex = blockIndex;
    this.transactionIndex = transactionIndex;
    this.result = result;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt256(this.assetHash || common.ZERO_UINT256);
    writer.writeArray(this.contractHashes, contractHash => {
      writer.writeUInt160(contractHash);
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
    const blockIndex = reader.readUInt32LE();
    const transactionIndex = reader.readUInt32LE();
    const result = deserializeWireBase(options);
    return new this({
      hash,
      assetHash: common.uInt256Equal(assetHash, common.ZERO_UINT256)
        ? undefined
        : assetHash,
      contractHashes,
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
