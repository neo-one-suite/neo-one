import { BN } from 'bn.js';
import { BaseState } from './BaseState';
import { common, ECPoint } from './common';
import { Equals, EquatableKey } from './Equatable';
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

export interface ValidatorKey {
  readonly publicKey: ECPoint;
}

export interface ValidatorAdd {
  readonly version?: number;
  readonly publicKey: ECPoint;
  readonly registered?: boolean;
  readonly votes?: BN;
}

export interface ValidatorUpdate {
  readonly registered?: boolean;
  readonly votes?: BN;
}

export interface ValidatorJSON {
  readonly version: number;
  readonly publicKey: string;
  readonly registered: boolean;
  readonly votes: string;
}

export class Validator extends BaseState
  implements SerializableWire<Validator>, EquatableKey, SerializableJSON<ValidatorJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Validator {
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
  public readonly equals: Equals = utils.equals(Validator, this, (other) =>
    common.ecPointEqual(this.publicKey, other.publicKey),
  );
  public readonly toKeyString = utils.toKeyString(Validator, () => common.ecPointToString(this.publicKey));
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ version, publicKey, registered = false, votes = utils.ZERO }: ValidatorAdd) {
    super({ version });
    this.publicKey = publicKey;
    this.registered = registered;
    this.votes = votes;
    this.sizeInternal = utils.lazy(
      () => IOHelper.sizeOfECPoint(this.publicKey) + IOHelper.sizeOfBoolean + IOHelper.sizeOfFixed8,
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ votes = this.votes, registered = this.registered }: ValidatorUpdate): Validator {
    return new Validator({
      version: this.version,
      publicKey: this.publicKey,
      registered,
      votes,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeECPoint(this.publicKey);
    writer.writeBoolean(this.registered);
    writer.writeFixed8(this.votes);
  }

  public serializeJSON(_context: SerializeJSONContext): ValidatorJSON {
    return {
      version: this.version,
      publicKey: JSONHelper.writeECPoint(this.publicKey),
      registered: this.registered,
      votes: JSONHelper.writeFixed8(this.votes),
    };
  }
}
