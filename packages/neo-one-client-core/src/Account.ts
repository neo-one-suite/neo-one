import BN from 'bn.js';
import _ from 'lodash';
import { BaseState } from './BaseState';
import { Equatable, Equals } from './Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializeWire,
  SerializableWire,
  SerializeJSONContext,
  SerializableJSON,
  createSerializeWire,
} from './Serializable';
import { InputJSON } from './transaction';
import { common, ECPoint, UInt160, UInt160Hex, UInt256Hex } from './common';
import {
  utils,
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export interface AccountKey {
  hash: UInt160;
}
export interface AccountAdd {
  version?: number;
  hash: UInt160;
  isFrozen?: boolean;
  votes?: ECPoint[];
  balances?: {
    [assetHash: string]: BN;
  };
}

export interface AccountUpdate {
  isFrozen?: boolean;
  votes?: ECPoint[];
  balances?: {
    [assetHash: string]: BN;
  };
}

export interface AccountJSON {
  version: number;
  script_hash: string;
  frozen: boolean;
  votes: string[];
  balances: Array<{ asset: string; value: string }>;
  unspent: InputJSON[];
  unclaimed: InputJSON[];
}

export class Account extends BaseState
  implements
    SerializableWire<Account>,
    SerializableJSON<AccountJSON>,
    Equatable {
  public readonly hash: UInt160;
  public readonly hashHex: UInt160Hex;
  public readonly isFrozen: boolean;
  public readonly votes: ECPoint[];
  public readonly balances: {
    [assetHash: string]: BN;
  };
  public readonly equals: Equals = utils.equals(Account, (other) =>
    common.uInt160Equal(this.hash, other.hash),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  private readonly sizeInternal: () => number;

  constructor({ version, hash, isFrozen, votes, balances }: AccountAdd) {
    super({ version });
    this.hash = hash;
    this.hashHex = common.uInt160ToHex(hash);
    this.isFrozen = isFrozen || false;
    this.votes = votes || [];
    this.balances = balances || {};
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfBoolean +
        IOHelper.sizeOfArray(this.votes, (vote) =>
          IOHelper.sizeOfECPoint(vote),
        ) +
        IOHelper.sizeOfObject(
          this.balances,
          () => IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8,
        ),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public isDeletable(): boolean {
    const balances = Object.values(this.balances);
    return (
      !this.isFrozen &&
      this.votes.length === 0 &&
      (balances.length === 0 ||
        balances.every((value) => value.lte(utils.ZERO)))
    );
  }

  public getBalance(asset: UInt256Hex): BN {
    return this.balances[asset] || utils.ZERO;
  }

  public update({ isFrozen, votes, balances }: AccountUpdate): Account {
    return new Account({
      hash: this.hash,
      isFrozen: isFrozen == null ? this.isFrozen : isFrozen,
      votes: votes == null ? this.votes : votes,
      balances: balances == null ? this.balances : balances,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt160(this.hash);
    writer.writeBoolean(this.isFrozen);
    writer.writeArray(this.votes, (vote) => {
      writer.writeECPoint(vote);
    });
    const balances = _.pickBy(this.balances, (value) =>
      value.gt(utils.ZERO),
    ) as { [assetHash: string]: BN };
    writer.writeObject(balances, (key: string, value: BN) => {
      writer.writeUInt256(common.stringToUInt256(key));
      writer.writeFixed8(value);
    });
  }

  public deserializeWireBase(options: DeserializeWireBaseOptions): Account {
    const { reader } = options;
    const version = reader.readUInt8();
    const hash = reader.readUInt160();
    const isFrozen = reader.readBoolean();
    const votes = reader.readArray(() => reader.readECPoint());
    const balances = reader.readObject(() => {
      const key = common.uInt256ToHex(reader.readUInt256());
      const value = reader.readFixed8();
      return { key, value };
    });

    return new Account({
      version,
      hash,
      isFrozen,
      votes,
      balances,
    });
  }

  public deserializeWire(options: DeserializeWireOptions): Account {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<AccountJSON> {
    const [unspent, unclaimed] = await Promise.all([
      context.getUnspent(this.hash),
      context.getUnclaimed(this.hash),
    ]);

    return {
      version: this.version,
      script_hash: JSONHelper.writeUInt160(this.hash),
      frozen: this.isFrozen,
      votes: this.votes.map((vote) => JSONHelper.writeECPoint(vote)),
      balances: Object.entries(this.balances).map(([asset, value]) => ({
        asset: JSONHelper.writeUInt256(asset),
        value: JSONHelper.writeFixed8(value),
      })),

      unspent: unspent.map((input) => input.serializeJSON(context)),
      unclaimed: unclaimed.map((input) => input.serializeJSON(context)),
    };
  }
}
