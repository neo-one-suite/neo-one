import { BinaryWriter, HeaderJSON, InvalidFormatError, IOHelper, UInt256 } from '@neo-one/client-common';
import { BlockBase, BlockBaseAdd } from './BlockBase';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { BinaryReader, utils } from './utils';

export type HeaderAdd = BlockBaseAdd;
export interface HeaderKey {
  readonly hashOrIndex: UInt256 | number;
}

export class Header extends BlockBase implements SerializableWire<Header>, SerializableJSON<HeaderJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Header {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    if (reader.readUInt8() !== 0) {
      throw new InvalidFormatError(`Expected Header BinaryReader readUInt8() to be 0. Received: ${reader.readUInt8()}`);
    }

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      nextConsensus: blockBase.nextConsensus,
      witness: blockBase.witness,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Header {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  protected readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt8);

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(0);
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<HeaderJSON> {
    return super.serializeBlockBaseJSON(context);
  }
}
