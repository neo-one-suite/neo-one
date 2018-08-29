import { BN } from 'bn.js';
import _ from 'lodash';
import { BaseState } from './BaseState';
import { common, ECPoint, UInt160, UInt160Hex, UInt256Hex } from './common';
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
import { InputJSON } from './transaction';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from './utils';

export interface AccountKey {
  readonly hash: UInt160;
}
export interface AccountAdd {
  readonly version?: number;
  readonly hash: UInt160;
  readonly isFrozen?: boolean;
  readonly votes?: ReadonlyArray<ECPoint>;
  readonly balances?: { readonly [AssetHash in string]?: BN };
}

export interface AccountUpdate {
  readonly isFrozen?: boolean;
  readonly votes?: ReadonlyArray<ECPoint>;
  readonly balances?: AccountAdd['balances'];
}

export interface AccountJSON {
  readonly version: number;
  readonly script_hash: string;
  readonly frozen: boolean;
  readonly votes: ReadonlyArray<string>;
  readonly balances: ReadonlyArray<{ readonly asset: string; readonly value: string }>;
  readonly unspent: ReadonlyArray<InputJSON>;
  readonly unclaimed: ReadonlyArray<InputJSON>;
}

export class Account extends BaseState
  implements SerializableWire<Account>, SerializableJSON<AccountJSON>, EquatableKey {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Account {
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

  public static deserializeWire(options: DeserializeWireOptions): Account {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt160;
  public readonly hashHex: UInt160Hex;
  public readonly isFrozen: boolean;
  public readonly votes: ReadonlyArray<ECPoint>;
  public readonly balances: { readonly [AssetHash in string]?: BN };
  public readonly equals: Equals = utils.equals(Account, this, (other) => common.uInt160Equal(this.hash, other.hash));
  public readonly toKeyString = utils.toKeyString(Account, () => this.hashHex);
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ version, hash, isFrozen = false, votes = [], balances = {} }: AccountAdd) {
    super({ version });
    this.hash = hash;
    this.hashHex = common.uInt160ToHex(hash);
    this.isFrozen = isFrozen;
    this.votes = votes;
    this.balances = balances;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfBoolean +
        IOHelper.sizeOfArray(this.votes, (vote) => IOHelper.sizeOfECPoint(vote)) +
        IOHelper.sizeOfObject(this.balances, () => IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8),
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
      (balances.length === 0 || balances.every((value) => value !== undefined && value.lte(utils.ZERO)))
    );
  }

  public getBalance(asset: UInt256Hex): BN {
    const balance = this.balances[asset];

    return balance === undefined ? utils.ZERO : balance;
  }

  public update({ isFrozen = this.isFrozen, votes = this.votes, balances = this.balances }: AccountUpdate): Account {
    return new Account({
      hash: this.hash,
      isFrozen,
      votes,
      balances,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt160(this.hash);
    writer.writeBoolean(this.isFrozen);
    writer.writeArray(this.votes, (vote) => {
      writer.writeECPoint(vote);
    });
    const balances = _.pickBy(this.balances, (value) => value !== undefined && value.gt(utils.ZERO)) as {
      [assetHash: string]: BN;
    };
    writer.writeObject(balances, (key: string, value) => {
      writer.writeUInt256(common.stringToUInt256(key));
      writer.writeFixed8(value);
    });
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<AccountJSON> {
    const [unspent, unclaimed] = await Promise.all([context.getUnspent(this.hash), context.getUnclaimed(this.hash)]);

    return {
      version: this.version,
      script_hash: JSONHelper.writeUInt160(this.hash),
      frozen: this.isFrozen,
      votes: this.votes.map((vote) => JSONHelper.writeECPoint(vote)),
      balances: Object.entries(this.balances).map(([asset, value]) => ({
        asset: JSONHelper.writeUInt256(asset),
        // tslint:disable-next-line no-non-null-assertion
        value: JSONHelper.writeFixed8(value!),
      })),

      unspent: unspent.map((input) => input.serializeJSON(context)),
      unclaimed: unclaimed.map((input) => input.serializeJSON(context)),
    };
  }
}
