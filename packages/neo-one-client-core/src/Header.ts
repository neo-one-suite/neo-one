import { BlockBase, BlockBaseAdd, BlockBaseJSON } from './BlockBase';
import { UInt256 } from './common';
import { InvalidFormatError } from './errors';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { BinaryReader, BinaryWriter, IOHelper, utils } from './utils';

export type HeaderAdd = BlockBaseAdd;
export interface HeaderKey {
  hashOrIndex: UInt256 | number;
}

// tslint:disable-next-line
export interface HeaderJSON extends BlockBaseJSON {}

export class Header extends BlockBase
  implements SerializableWire<Header>, SerializableJSON<HeaderJSON> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): Header {
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

  public static deserializeWire(options: DeserializeWireOptions): Header {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8,
  );

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(0);
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<HeaderJSON> {
    return super.serializeBlockBaseJSON(context);
  }
}
