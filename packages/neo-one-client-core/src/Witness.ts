import { Equals, Equatable } from './Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from './utils';

export interface WitnessAdd {
  readonly verification: Buffer;
  readonly invocation: Buffer;
}

export interface WitnessJSON {
  readonly invocation: string;
  readonly verification: string;
}

export class Witness implements SerializableWire<Witness>, SerializableJSON<WitnessJSON>, Equatable {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Witness {
    const invocation = reader.readVarBytesLE(utils.USHORT_MAX_NUMBER_PLUS_ONE);
    const verification = reader.readVarBytesLE(utils.USHORT_MAX_NUMBER_PLUS_ONE);

    return new this({ invocation, verification });
  }

  public static deserializeWire(options: DeserializeWireOptions): Witness {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly verification: Buffer;
  public readonly invocation: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly equals: Equals = utils.equals(
    Witness,
    (other) => this.invocation.equals(other.invocation) && this.verification.equals(other.verification),
  );
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarBytesLE(this.invocation) + IOHelper.sizeOfVarBytesLE(this.verification),
  );

  public constructor({ invocation, verification }: WitnessAdd) {
    this.invocation = invocation;
    this.verification = verification;
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.invocation);
    writer.writeVarBytesLE(this.verification);
  }

  public serializeJSON(_context: SerializeJSONContext): WitnessJSON {
    return {
      invocation: JSONHelper.writeBuffer(this.invocation),
      verification: JSONHelper.writeBuffer(this.verification),
    };
  }
}
