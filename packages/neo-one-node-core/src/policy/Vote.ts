import {
  BinaryReader,
  BinaryWriter,
  common,
  ECPoint,
  IOHelper,
  JSONHelper,
  UInt160,
  VoteJSON,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { utils } from '../utils';

export interface VoteAdd {
  readonly account: UInt160;
  readonly voteTo: ECPoint;
  readonly balance: BN;
  readonly index: BN;
}

export class Vote implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Vote {
    const { reader } = options;
    const account = reader.readUInt160();
    const voteTo = reader.readECPoint();
    const balance = reader.readInt64LE();
    const index = reader.readUInt64LE();

    return new this({ account, voteTo, balance, index });
  }

  public static deserializeWire(options: DeserializeWireOptions): Vote {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly account: UInt160;
  public readonly voteTo: ECPoint;
  public readonly balance: BN;
  public readonly index: BN;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ account, voteTo, balance, index }: VoteAdd) {
    this.account = account;
    this.voteTo = voteTo;
    this.balance = balance;
    this.index = index;
    this.sizeInternal = utils.lazy(
      () => IOHelper.sizeOfUInt160 + IOHelper.sizeOfUInt64LE + IOHelper.sizeOfUInt64LE + IOHelper.sizeOfECPoint(voteTo),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.account);
    writer.writeECPoint(this.voteTo);
    writer.writeInt64LE(this.balance);
    writer.writeUInt64LE(this.index);
  }

  public serializeJSON(): VoteJSON {
    return {
      account: JSONHelper.writeUInt160(this.account),
      // tslint:disable-next-line: no-null-keyword
      voteTo: common.ecPointIsInfinity(this.voteTo) ? null : JSONHelper.writeECPoint(this.voteTo),
      balance: JSONHelper.writeUInt64(this.balance),
      index: JSONHelper.writeUInt64(this.index),
    };
  }
}
