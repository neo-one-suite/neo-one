import {
  BaseState,
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  IOHelper,
  SerializableWire,
  SerializeWire,
  utils,
} from '@neo-one/client-core';
import BN from 'bn.js';
type Votes = ReadonlyArray<BN | undefined>;
export interface ValidatorsCountUpdate {
  readonly votes?: Votes;
}

export interface ValidatorsCountAdd {
  readonly version?: number;
  readonly votes?: Votes;
}

export class ValidatorsCount extends BaseState implements SerializableWire<ValidatorsCount> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ValidatorsCount {
    const { reader } = options;
    const version = reader.readUInt8();
    const votes = reader.readArray(() => reader.readFixed8());

    return new this({ version, votes });
  }

  public static deserializeWire(options: DeserializeWireOptions): ValidatorsCount {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly votes: Votes;
  private readonly sizeInternal: () => number;

  public constructor({ version, votes = [] }: ValidatorsCountAdd = {}) {
    super({ version });
    this.votes = votes;
    this.sizeInternal = utils.lazy(
      () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfArray(this.votes, () => IOHelper.sizeOfFixed8),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ votes = this.votes }: ValidatorsCountUpdate): ValidatorsCount {
    return new ValidatorsCount({
      version: this.version,
      votes,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeArray(this.votes, (value) => {
      writer.writeFixed8(value === undefined ? utils.ZERO : value);
    });
  }
}
