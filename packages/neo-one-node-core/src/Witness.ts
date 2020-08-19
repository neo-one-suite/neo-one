import { crypto, IOHelper, JSONHelper, WitnessJSON, WitnessModel } from '@neo-one/client-common';
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

// TODO: put these somewhere else https://github.com/neo-project/neo/blob/master/src/neo/Network/P2P/Payloads/Witness.cs
const invocationSize = 663;
const verificationSize = 361;

export class Witness extends WitnessModel implements SerializableJSON<WitnessJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Witness {
    const { reader } = options;
    const invocation = reader.readVarBytesLE(invocationSize);
    const verification = reader.readVarBytesLE(verificationSize);

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

  public serializeJSON(_context: SerializeJSONContext): WitnessJSON {
    return {
      invocation: JSONHelper.writeBuffer(this.invocation),
      verification: JSONHelper.writeBuffer(this.verification),
    };
  }
}
