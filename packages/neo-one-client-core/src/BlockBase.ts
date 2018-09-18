import BN from 'bn.js';
import { common, UInt160, UInt256, UInt256Hex } from './common';
import { crypto } from './crypto';
import { Equals, EquatableKey } from './Equatable';
import { InvalidFormatError, UnsignedBlockError } from './errors';
import { Header, HeaderKey } from './Header';
import { createSerializeWire, DeserializeWireBaseOptions, SerializeJSONContext, SerializeWire } from './Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from './utils';
import { Witness, WitnessJSON } from './Witness';

export interface BlockGetScriptHashesForVerifyingOptions {
  readonly getHeader: (key: HeaderKey) => Promise<Header>;
}

export interface BlockBaseAdd {
  readonly version?: number;
  readonly previousHash: UInt256;
  readonly merkleRoot: UInt256;
  readonly timestamp: number;
  readonly index: number;
  readonly consensusData: BN;
  readonly nextConsensus: UInt160;
  readonly script?: Witness;
  readonly hash?: UInt256;
}

export interface BlockBaseJSON {
  readonly version: number;
  readonly hash: string;
  readonly previousblockhash: string;
  readonly merkleroot: string;
  readonly time: number;
  readonly index: number;
  readonly nonce: string;
  readonly nextconsensus: string;
  readonly script: WitnessJSON;
  readonly size: number;
  readonly confirmations: number;
}

export abstract class BlockBase implements EquatableKey {
  public static deserializeBlockBaseWireBase(options: DeserializeWireBaseOptions): BlockBaseAdd {
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

  public readonly version: number;
  public readonly previousHash: UInt256;
  public readonly merkleRoot: UInt256;
  public readonly timestamp: number;
  public readonly index: number;
  public readonly consensusData: BN;
  public readonly nextConsensus: UInt160;
  // tslint:disable-next-line no-any
  public readonly equals: Equals = utils.equals(this.constructor as any, this, (other: any) =>
    common.uInt256Equal(this.hash, other.hash),
  );
  public readonly toKeyString = utils.toKeyString(BlockBase, () => this.hashHex);
  public readonly getScriptHashesForVerifying = utils.lazyAsync(
    async ({ getHeader }: BlockGetScriptHashesForVerifyingOptions) => {
      if (this.index === 0) {
        return new Set([common.uInt160ToHex(crypto.toScriptHash(this.script.verification))]);
      }

      const previousHeader = await getHeader({
        hashOrIndex: this.previousHash,
      });

      return new Set([common.uInt160ToHex(previousHeader.nextConsensus)]);
    },
  );
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase.bind(this));
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());
  private readonly scriptInternal: Witness | undefined;
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      this.script.size +
      this.sizeExclusive(),
  );

  public constructor({
    version = 0,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    script,
    hash,
  }: BlockBaseAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.merkleRoot = merkleRoot;
    this.timestamp = timestamp;
    this.index = index;
    this.consensusData = consensusData;
    this.nextConsensus = nextConsensus;
    this.scriptInternal = script;
    const hashIn = hash;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;
  }

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get hashHex(): UInt256Hex {
    return this.hashHexInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public get script(): Witness {
    if (this.scriptInternal === undefined) {
      throw new UnsignedBlockError(common.uInt256ToString(this.hash));
    }

    return this.scriptInternal;
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt256(this.merkleRoot);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt32LE(this.index);
    writer.writeUInt64LE(this.consensusData);
    writer.writeUInt160(this.nextConsensus);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeUInt8(1);
    this.script.serializeWireBase(writer);
  }

  public serializeBlockBaseJSON(context: SerializeJSONContext): BlockBaseJSON {
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
      confirmations: 0,
    };
  }

  protected readonly sizeExclusive: () => number = () => 0;
}
