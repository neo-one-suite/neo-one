import { BinaryWriter } from '../BinaryWriter';
import { crypto } from '../crypto';
import { IOHelper } from '../IOHelper';
import { JSONHelper } from '../JSONHelper';
import { utils } from '../utils';
import { MethodTokenModel } from './MethodTokenModel';
import { createSerializeWire, SerializableJSON, SerializableWire, SerializeWire } from './Serializable';
import { NefFileJSON } from './types';

export interface NefFileAdd {
  readonly compiler: string;
  readonly source: string;
  readonly tokens: readonly MethodTokenModel[];
  readonly script: Buffer;
  readonly checkSum?: number;
}

export class NefFileModel implements SerializableJSON<NefFileJSON>, SerializableWire {
  public get size() {
    return this.sizeInternal();
  }

  public static readonly magic = 0x3346454e;
  public readonly compiler: string;
  public readonly source: string;
  public readonly tokens: readonly MethodTokenModel[];
  public readonly script: Buffer;
  public readonly checkSum: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeForChecksum: SerializeWire = createSerializeWire(this.serializeForChecksumBase.bind(this));

  private readonly headerSize = utils.lazy(() => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfFixedString(64));
  private readonly sizeInternal = utils.lazy(
    () =>
      this.headerSize() +
      IOHelper.sizeOfVarString(this.source) +
      IOHelper.sizeOfUInt8 + // 1-byte reserve
      IOHelper.sizeOfArray(this.tokens, (token) => token.size) +
      IOHelper.sizeOfUInt16LE + // 2-byte reserve
      IOHelper.sizeOfVarBytesLE(this.script) +
      IOHelper.sizeOfUInt32LE,
  );

  public constructor({ compiler, source, tokens, script, checkSum }: NefFileAdd) {
    this.compiler = compiler;
    this.source = source;
    this.tokens = tokens;
    this.script = script;
    this.checkSum = checkSum ?? crypto.hash256(this.serializeForChecksum()).readUInt32LE(0);
  }

  public serializeHeader(writer: BinaryWriter): void {
    writer.writeUInt32LE(NefFileModel.magic);
    writer.writeFixedString(this.compiler, 64);
  }

  public serializeForChecksumBase(writer: BinaryWriter): void {
    this.serializeHeader(writer);
    writer.writeVarString(this.source, 256);
    writer.writeUInt8(0);
    writer.writeArray(this.tokens, (token) => token.serializeWireBase(writer));
    writer.writeUInt16LE(0);
    writer.writeVarBytesLE(this.script);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeForChecksumBase(writer);
    writer.writeUInt32LE(this.checkSum);
  }

  public serializeJSON(): NefFileJSON {
    return {
      magic: NefFileModel.magic,
      compiler: this.compiler,
      source: this.source,
      tokens: this.tokens.map((token) => token.serializeJSON()),
      script: JSONHelper.writeBase64Buffer(this.script),
      checksum: this.checkSum,
    };
  }
}
