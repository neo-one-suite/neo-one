import BN from 'bn.js';
import { BaseState } from './BaseState';
import { common, ECPoint } from './common';
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
import {
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
  utils,
} from './utils';

export interface ValidatorKey {
  publicKey: ECPoint;
}

export interface ValidatorAdd {
  version?: number;
  publicKey: ECPoint;
  registered?: boolean;
  votes?: BN;
}

export interface ValidatorUpdate {
  registered?: boolean;
  votes?: BN;
}

export interface ValidatorJSON {
  version: number;
  publicKey: string;
  registered: boolean;
  votes: string;
}

export class Validator extends BaseState
  implements
    SerializableWire<Validator>,
    Equatable,
    SerializableJSON<ValidatorJSON> {
  public static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): Validator {
    const version = reader.readUInt8();
    const publicKey = reader.readECPoint();
    const registered = reader.readBoolean();
    const votes = reader.readFixed8();

    return new this({ version, publicKey, registered, votes });
  }

  public static deserializeWire(options: DeserializeWireOptions): Validator {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly publicKey: ECPoint;
  public readonly registered: boolean;
  public readonly votes: BN;
  public readonly equals: Equals = utils.equals(Validator, (other) =>
    common.ecPointEqual(this.publicKey, other.publicKey),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  private readonly sizeInternal: () => number;

  constructor({ version, publicKey, registered, votes }: ValidatorAdd) {
    super({ version });
    this.publicKey = publicKey;
    this.registered = registered == null ? false : registered;
    this.votes = votes == null ? utils.ZERO : votes;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfECPoint(this.publicKey) +
        IOHelper.sizeOfBoolean +
        IOHelper.sizeOfFixed8,
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ votes, registered }: ValidatorUpdate): Validator {
    return new Validator({
      version: this.version,
      publicKey: this.publicKey,
      registered: registered == null ? this.registered : registered,
      votes: votes == null ? this.votes : votes,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeECPoint(this.publicKey);
    writer.writeBoolean(this.registered);
    writer.writeFixed8(this.votes);
  }

  public serializeJSON(context: SerializeJSONContext): ValidatorJSON {
    return {
      version: this.version,
      publicKey: JSONHelper.writeECPoint(this.publicKey),
      registered: this.registered,
      votes: JSONHelper.writeFixed8(this.votes),
    };
  }
}
