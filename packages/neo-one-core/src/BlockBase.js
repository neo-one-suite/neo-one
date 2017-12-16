/* @flow */
import type BN from 'bn.js';

import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
  type SerializeWire,
  createSerializeWire,
} from './Serializable';
import { type Equatable, type Equals } from './Equatable';
import type Header, { HeaderKey } from './Header';
import { InvalidFormatError, UnsignedBlockError } from './errors';
import Witness, { type WitnessJSON } from './Witness';

import common, { type UInt160, type UInt256, type UInt256Hex } from './common';
import crypto from './crypto';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from './utils';

export type BlockGetScriptHashesForVerifyingOptions = {|
  getHeader: (key: HeaderKey) => Promise<Header>,
|};

export type BlockBaseAdd = {|
  version?: number,
  previousHash: UInt256,
  merkleRoot: UInt256,
  timestamp: number,
  index: number,
  consensusData: BN,
  nextConsensus: UInt160,
  script?: Witness,
  hash?: UInt256,
|};

export type BlockBaseJSON = {|
  version: number,
  hash: string,
  previousblockhash: string,
  merkleroot: string,
  time: number,
  index: number,
  nonce: string,
  nextconsensus: string,
  script: WitnessJSON,
  size: number,
  confirmations: number,
|};

export default class BlockBase implements Equatable {
  version: number;
  previousHash: UInt256;
  merkleRoot: UInt256;
  timestamp: number;
  index: number;
  consensusData: BN;
  nextConsensus: UInt160;
  _script: ?Witness;

  _hash: () => UInt256;

  constructor({
    version,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    script,
    hash,
  }: BlockBaseAdd) {
    this.version = version || 0;
    this.previousHash = previousHash;
    this.merkleRoot = merkleRoot;
    this.timestamp = timestamp;
    this.index = index;
    this.consensusData = consensusData;
    this.nextConsensus = nextConsensus;
    this._script = script;
    const hashIn = hash;
    this._hash =
      hashIn == null
        ? utils.lazy(() => crypto.hash256(this.message))
        : () => hashIn;
  }

  _hashHex = utils.lazy(() => common.uInt256ToHex(this.hash));
  _message = utils.lazy(() => this.serializeUnsigned());
  __thisSize = utils.lazy(
    () =>
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      this.script.size,
  );

  get hash(): UInt256 {
    return this._hash();
  }

  get hashHex(): UInt256Hex {
    return this._hashHex();
  }

  get message(): Buffer {
    return this._message();
  }

  get size(): number {
    return this.__thisSize();
  }

  // TODO: Split these classes out so we don't have this hacky error here.
  get script(): Witness {
    if (this._script == null) {
      throw new UnsignedBlockError();
    }

    return this._script;
  }

  equals: Equals = utils.equals(this.constructor, other =>
    common.uInt256Equal(this.hash, other.hash),
  );

  getScriptHashesForVerifying = utils.lazyAsync(
    async ({ getHeader }: BlockGetScriptHashesForVerifyingOptions) => {
      if (this.index === 0) {
        return new Set([
          common.uInt160ToHex(crypto.toScriptHash(this.script.verification)),
        ]);
      }

      const previousHeader = await getHeader({
        hashOrIndex: this.previousHash,
      });
      return new Set([common.uInt160ToHex(previousHeader.nextConsensus)]);
    },
  );

  serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt256(this.merkleRoot);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt32LE(this.index);
    writer.writeUInt64LE(this.consensusData);
    writer.writeUInt160(this.nextConsensus);
  }

  serializeUnsigned: SerializeWire = createSerializeWire(
    this.serializeUnsignedBase.bind(this),
  );

  serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeUInt8(1);
    this.script.serializeWireBase(writer);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeBlockBaseWireBase(
    options: DeserializeWireBaseOptions,
  ): BlockBaseAdd {
    const { reader } = options;

    const version = reader.readUInt32LE();
    const previousHash = reader.readUInt256();
    const merkleRoot = reader.readUInt256();
    const timestamp = reader.readUInt32LE();
    const index = reader.readUInt32LE();
    const consensusData = reader.readUInt64LE();
    const nextConsensus = reader.readUInt160();
    if (reader.readUInt8() !== 1) {
      throw new InvalidFormatError();
    }
    const script = Witness.deserializeWireBase(options);

    return {
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      consensusData,
      nextConsensus,
      script,
    };
  }

  serializeBlockBaseJSON(context: SerializeJSONContext): BlockBaseJSON {
    return {
      version: this.version,
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      previousblockhash: JSONHelper.writeUInt256(this.previousHash),
      merkleroot: JSONHelper.writeUInt256(this.merkleRoot),
      time: this.timestamp,
      index: this.index,
      nonce: JSONHelper.writeUInt64LE(this.consensusData),
      nextconsensus: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.nextConsensus,
      }),
      script: this.script.serializeJSON(context),
      // TODO: Not sure if we should bother with this...
      confirmations: 0,
    };
  }
}
