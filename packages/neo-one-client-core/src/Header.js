/* @fl/* @flow */
import BlockBase, { type BlockBaseAdd, type BlockBaseJSON } from './BlockBase';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableWire,
  type SerializableJSON,
  type SerializeJSONContext,
} from './Serializable';
import { InvalidFormatError } from './errors';
import { type UInt256 } from './common';

import utils, { BinaryReader, type BinaryWriter, IOHelper } from './utils';

export type HeaderAdd = BlockBaseAdd;
export type HeaderKey = {|
  hashOrIndex: UInt256 | number,
|};

export type HeaderJSON = {|
  ...BlockBaseJSON,
|};

export default class Header extends BlockBase
  implements SerializableWire<Header>, SerializableJSON<HeaderJSON> {
  __headerSize: () => number;

  constructor(add: BlockBaseAdd) {
    super(add);
    this.__headerSize = utils.lazy(() => super.size + IOHelper.sizeOfUInt8);
  }

  get size(): number {
    return this.__headerSize();
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(0);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): Header {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    if (reader.readUInt8() !== 0) {
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
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  async serializeJSON(context: SerializeJSONContext): Promise<HeaderJSON> {
    return super.serializeBlockBaseJSON(context);
  }
}
