import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  HeaderJSON,
  InvalidFormatError,
  IOHelper,
  UInt256Hex,
} from '@neo-one/client-common';
import { BlockBase, BlockBaseAdd } from './BlockBase';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { utils } from './utils';

export type HeaderAdd = BlockBaseAdd;

export class Header extends BlockBase implements SerializableWire, SerializableJSON<HeaderJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Header {
    const { reader } = options;
    const blockBase = super.deserializeWireBase(options);
    const uint8 = reader.readUInt8();
    if (uint8 !== 0) {
      throw new InvalidFormatError(`Expected Header BinaryReader readUInt8() to be 0. Received: ${uint8}`);
    }

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      nextConsensus: blockBase.nextConsensus,
      witness: blockBase.witness,
      messageMagic: options.context.messageMagic,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Header {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned = createSerializeWire(super.serializeUnsignedBase.bind(this));

  protected readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt8);

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(0);
  }

  public serializeJSON(context: SerializeJSONContext): HeaderJSON {
    return super.serializeJSON(context);
  }

  public serializeJSONVerbose(
    context: SerializeJSONContext,
    verbose: { readonly confirmations: number; readonly nextblockhash?: UInt256Hex },
  ) {
    const base = this.serializeJSON(context);

    return {
      ...base,
      confirmations: verbose.confirmations,
      nextblockhash: verbose.nextblockhash,
    };
  }
}
