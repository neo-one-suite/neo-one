import { BinaryReader, crypto, IOHelper, JSONHelper, WitnessJSON, WitnessModel } from '@neo-one/client-common';
import { WITNESS_INVOCATION_SIZE, WITNESS_VERIFICATION_SIZE } from './constants';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from './Serializable';
import { utils } from './utils';

export interface WitnessAdd {
  readonly verification: Buffer;
  readonly invocation: Buffer;
}

export class Witness extends WitnessModel implements SerializableJSON<WitnessJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Witness {
    const { reader } = options;
    const invocation = reader.readVarBytesLE(WITNESS_INVOCATION_SIZE);
    const verification = reader.readVarBytesLE(WITNESS_VERIFICATION_SIZE);

    return new Witness({
      invocation,
      verification,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Witness {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarBytesLE(this.invocation) + IOHelper.sizeOfVarBytesLE(this.verification),
  );
  private readonly scriptHashInternal = utils.lazy(() => crypto.hash160(this.verification));

  public get scriptHash() {
    return this.scriptHashInternal();
  }

  public get size() {
    return this.sizeInternal();
  }

  public serializeJSON(): WitnessJSON {
    return {
      invocation: JSONHelper.writeBase64Buffer(this.invocation),
      verification: JSONHelper.writeBase64Buffer(this.verification),
    };
  }
}
