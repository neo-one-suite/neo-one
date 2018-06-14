import {
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  Equals,
  Equatable,
  Input,
  IOHelper,
  SerializableWire,
  SerializeWire,
  UInt160,
  UInt160Hex,
  utils,
} from '@neo-one/client-core';

export interface AccountInputKey {
  readonly hash: UInt160;
  readonly input: Input;
}

export interface AccountInputsKey {
  readonly hash: UInt160;
}

export interface AccountInputAdd {
  readonly hash: UInt160;
  readonly input: Input;
}

export class AccountInput implements Equatable, SerializableWire<AccountInput> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): AccountInput {
    const { reader } = options;
    const hash = reader.readUInt160();
    const input = Input.deserializeWireBase(options);

    return new AccountInput({ hash, input });
  }

  public static deserializeWire(options: DeserializeWireOptions): AccountInput {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt160;
  public readonly hashHex: UInt160Hex;
  public readonly input: Input;
  public readonly equals: Equals = utils.equals(
    AccountInput,
    (other) => common.uInt160Equal(this.hash, other.hash) && this.input.equals(other.input),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, input }: AccountInputAdd) {
    this.hash = hash;
    this.hashHex = common.uInt160ToHex(hash);
    this.input = input;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt160 + this.input.size);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    this.input.serializeWireBase(writer);
  }
}
