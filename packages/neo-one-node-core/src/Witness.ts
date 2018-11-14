import { IOHelper, JSONHelper, WitnessJSON, WitnessModel } from '@neo-one/client-common';
import { Equals, EquatableKey } from './Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from './Serializable';
import { BinaryReader, utils } from './utils';

export interface WitnessAdd {
  readonly verification: Buffer;
  readonly invocation: Buffer;
}

export class Witness extends WitnessModel implements SerializableJSON<WitnessJSON>, EquatableKey {
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

  public static fromModel(witness: WitnessModel): Witness {
    return new this({ invocation: witness.invocation, verification: witness.verification });
  }

  public readonly equals: Equals = utils.equals(
    Witness,
    this,
    (other) => this.invocation.equals(other.invocation) && this.verification.equals(other.verification),
  );
  public readonly toKeyString = utils.toKeyString(
    Witness,
    () => `${this.invocation.toString('hex')}:${this.verification.toString('hex')}`,
  );
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarBytesLE(this.invocation) + IOHelper.sizeOfVarBytesLE(this.verification),
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeJSON(_context: SerializeJSONContext): WitnessJSON {
    return {
      invocation: JSONHelper.writeBuffer(this.invocation),
      verification: JSONHelper.writeBuffer(this.verification),
    };
  }
}
