import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  IOHelper,
  SerializableWire,
  UInt256,
  utils as clientCommonUtils,
} from '@neo-one/client-common';
import { NotSupportedError } from './errors';
import { Header } from './Header';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { StackItem } from './StackItems';
import { utils } from './utils';

export interface TrimmedBlockAdd {
  readonly header: Header;
  readonly hashes: readonly UInt256[];
}

export interface BlockKey {
  readonly hashOrIndex: UInt256 | number;
}

export class TrimmedBlock implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): TrimmedBlock {
    const { reader } = options;
    const header = Header.deserializeWireBase(options);
    const hashes = reader.readArray(() => reader.readUInt256(), clientCommonUtils.USHORT_MAX_NUMBER);

    return new TrimmedBlock({
      header,
      hashes,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static fromStackItem(_stackItem: StackItem) {
    throw new NotSupportedError('TrimmedBlock fromStackItem not supported');
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly hashes: readonly UInt256[];
  public readonly header: Header;
  private readonly sizeInternal = utils.lazy(
    () => this.header.size + IOHelper.sizeOfArray(this.hashes, () => IOHelper.sizeOfUInt256),
  );

  public constructor({ header, hashes }: TrimmedBlockAdd) {
    this.header = header;
    this.hashes = hashes;
  }

  public get size() {
    return this.sizeInternal();
  }

  public get hash() {
    return this.header.hash;
  }

  public get index() {
    return this.header.index;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.header.serializeWireBase(writer);
    writer.writeArray(this.hashes, writer.writeUInt256.bind(writer));
  }
}
