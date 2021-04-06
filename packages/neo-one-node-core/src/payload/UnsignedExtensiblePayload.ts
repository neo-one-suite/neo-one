import {
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  crypto,
  InvalidFormatError,
  UInt160,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from '../Serializable';
import { utils } from '../utils';

export interface UnsignedExtensiblePayloadAdd {
  readonly category: string;
  readonly validBlockStart: number;
  readonly validBlockEnd: number;
  readonly sender: UInt160;
  readonly data: Buffer;
  readonly messageMagic: number;
}

export class UnsignedExtensiblePayload implements SerializableWire {
  public static deserializeUnsignedExtensiblePayloadWireBase(
    options: DeserializeWireBaseOptions,
  ): UnsignedExtensiblePayloadAdd {
    const { reader } = options;
    const category = reader.readVarString(32);
    const validBlockStart = reader.readUInt32LE();
    const validBlockEnd = reader.readUInt32LE();
    if (validBlockStart >= validBlockEnd) {
      throw new InvalidFormatError('Expected validBlockEnd to be greater than or equal to validBlockStart.');
    }
    const sender = reader.readUInt160();
    const data = reader.readVarBytesLE(utils.USHORT_MAX_NUMBER);

    return {
      category,
      validBlockStart,
      validBlockEnd,
      sender,
      data,
      messageMagic: options.context.messageMagic,
    };
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): UnsignedExtensiblePayload {
    return new this(this.deserializeUnsignedExtensiblePayloadWireBase(options));
  }

  public static deserializeWire(options: DeserializeWireOptions): UnsignedExtensiblePayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly category: string;
  public readonly validBlockStart: number;
  public readonly validBlockEnd: number;
  public readonly sender: UInt160;
  public readonly data: Buffer;
  public readonly magic: number;

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal = utils.lazy(() => crypto.calculateHash(this.serializeWire()));

  public constructor({
    category,
    validBlockStart,
    validBlockEnd,
    sender,
    data,
    messageMagic,
  }: UnsignedExtensiblePayloadAdd) {
    this.category = category;
    this.validBlockStart = validBlockStart;
    this.validBlockEnd = validBlockEnd;
    this.sender = sender;
    this.data = data;
    this.magic = messageMagic;
  }

  public get hash() {
    return this.hashInternal();
  }

  public get hashHex() {
    return common.uInt256ToHex(this.hash);
  }

  public getScriptHashesForVerifying() {
    return [this.sender];
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeVarString(this.category);
    writer.writeUInt32LE(this.validBlockStart);
    writer.writeUInt32LE(this.validBlockEnd);
    writer.writeUInt160(this.sender);
    writer.writeVarBytesLE(this.data);
  }
}
