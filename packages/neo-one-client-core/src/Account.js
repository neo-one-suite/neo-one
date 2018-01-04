/* @flow */
import type BN from 'bn.js';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import BaseState from './BaseState';
import { type Equatable, type Equals } from './Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type SerializeJSONContext,
  type SerializableJSON,
  createSerializeWire,
} from './Serializable';
import { type InputJSON, Input } from './transaction';

import common, {
  type ECPoint,
  type UInt160,
  type UInt160Hex,
  type UInt256Hex,
} from './common';
import utils, { BinaryReader, type BinaryWriter, JSONHelper } from './utils';

export type AccountKey = {| hash: UInt160 |};
export type AccountAdd = {|
  version?: number,
  hash: UInt160,
  isFrozen?: boolean,
  votes?: Array<ECPoint>,
  balances?: { [assetHash: UInt256Hex]: BN },
  unspent?: Array<Input>,
  unclaimed?: Array<Input>,
|};
export type AccountUpdate = {|
  isFrozen?: boolean,
  votes?: Array<ECPoint>,
  balances?: { [assetHash: UInt256Hex]: BN },
  unspent?: Array<Input>,
  unclaimed?: Array<Input>,
|};

export type AccountJSON = {|
  version: number,
  script_hash: string,
  frozen: boolean,
  votes: Array<string>,
  balances: Array<{|
    asset: string,
    value: string,
  |}>,
  unspent: Array<InputJSON>,
  unclaimed: Array<InputJSON>,
|};

export default class Account extends BaseState
  implements SerializableWire<Account>,
    SerializableJSON<AccountJSON>,
    Equatable {
  hash: UInt160;
  hashHex: UInt160Hex;
  isFrozen: boolean;
  votes: Array<ECPoint>;
  balances: { [assetHash: UInt256Hex]: BN };
  unspent: Array<Input>;
  unclaimed: Array<Input>;

  serializeWire: () => Buffer;

  constructor({
    version,
    hash,
    isFrozen,
    votes,
    balances,
    unspent,
    unclaimed,
  }: AccountAdd) {
    super({ version });
    this.hash = hash;
    this.hashHex = common.uInt160ToHex(hash);
    this.isFrozen = isFrozen || false;
    this.votes = votes || [];
    this.balances = balances || {};
    this.unspent = unspent || [];
    this.unclaimed = unclaimed || [];
  }

  equals: Equals = utils.equals(Account, other =>
    common.uInt160Equal(this.hash, other.hash),
  );

  isDeletable(): boolean {
    const balances = commonUtils.values(this.balances);
    return (
      !this.isFrozen &&
      this.votes.length === 0 &&
      (balances.length === 0 ||
        balances.every(value => value.lte(utils.ZERO))) &&
      this.unspent.length === 0 &&
      this.unclaimed.length === 0
    );
  }

  update({
    isFrozen,
    votes,
    balances,
    unspent,
    unclaimed,
  }: AccountUpdate): Account {
    return new Account({
      hash: this.hash,
      isFrozen: isFrozen == null ? this.isFrozen : isFrozen,
      votes: votes == null ? this.votes : votes,
      balances: balances == null ? this.balances : balances,
      unspent: unspent == null ? this.unspent : unspent,
      unclaimed: unclaimed == null ? this.unclaimed : unclaimed,
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt160(this.hash);
    writer.writeBoolean(this.isFrozen);
    writer.writeArray(this.votes, vote => {
      writer.writeECPoint(vote);
    });
    const balances = _.pickBy(this.balances, value => value.gt(utils.ZERO));
    writer.writeObject(balances, (key, value) => {
      writer.writeUInt256(key);
      writer.writeFixed8(value);
    });
    writer.writeArray(this.unspent, input => {
      input.serializeWireBase(writer);
    });
    writer.writeArray(this.unclaimed, input => {
      input.serializeWireBase(writer);
    });
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(options: DeserializeWireBaseOptions): Account {
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
    const unspent = reader.readArray(() => Input.deserializeWireBase(options));
    const unclaimed = reader.readArray(() =>
      Input.deserializeWireBase(options),
    );

    return new this({
      version,
      hash,
      isFrozen,
      votes,
      balances,
      unspent,
      unclaimed,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AccountJSON {
    return {
      version: this.version,
      script_hash: JSONHelper.writeUInt160(this.hash),
      frozen: this.isFrozen,
      votes: this.votes.map(vote => JSONHelper.writeECPoint(vote)),
      balances: commonUtils.entries(this.balances).map(([asset, value]) => ({
        asset: JSONHelper.writeUInt256(asset),
        value: JSONHelper.writeFixed8(value),
      })),
      unspent: this.unspent.map(input => input.serializeJSON(context)),
      unclaimed: this.unclaimed.map(input => input.serializeJSON(context)),
    };
  }
}
