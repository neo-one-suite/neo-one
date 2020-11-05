import {
  BinaryWriter,
  BlockBaseJSON,
  common,
  createGetHashData,
  crypto,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  UInt160,
  UInt256,
  UInt256Hex,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Equals, EquatableKey } from './Equatable';
import { UnsignedBlockError } from './errors';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  SerializableContainer,
  SerializableContainerType,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { BlockchainStorage } from './Storage';
import { utils } from './utils';
import { Verifiable, VerifyOptions } from './Verifiable';
import { Witness } from './Witness';

export interface BlockBaseAdd {
  readonly version?: number;
  readonly previousHash: UInt256;
  readonly merkleRoot: UInt256;
  readonly timestamp: BN;
  readonly index: number;
  readonly nextConsensus: UInt160;
  readonly witness?: Witness;
  readonly hash?: UInt256;
}

export abstract class BlockBase implements EquatableKey, SerializableContainer, Verifiable {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): BlockBaseAdd {
    const { version, previousHash, merkleRoot, timestamp, index, nextConsensus } = this.deserializeWireBaseUnsigned(
      options,
    );
    const { reader } = options;

    const witnesses = reader.readArray(() => Witness.deserializeWireBase(options));
    if (witnesses.length !== 1) {
      throw new InvalidFormatError(`Expected exactly 1 witness, found: ${witnesses.length}`);
    }

    return {
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness: witnesses[0],
    };
  }
  public static deserializeWireBaseUnsigned(options: DeserializeWireBaseOptions): BlockBaseAdd {
    const { reader } = options;

    const version = reader.readUInt32LE();
    const previousHash = reader.readUInt256();
    const merkleRoot = reader.readUInt256();
    const timestamp = reader.readUInt64LE();
    const index = reader.readUInt32LE();
    const nextConsensus = reader.readUInt160();

    return {
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
    };
  }

  public readonly type: SerializableContainerType = 'Block';
  public readonly version: number;
  public readonly previousHash: UInt256;
  public readonly merkleRoot: UInt256;
  public readonly timestamp: BN;
  public readonly index: number;
  public readonly nextConsensus: UInt160;
  public readonly getScriptHashesForVerifying = utils.lazyAsync(
    async (context: { readonly storage: BlockchainStorage }) => {
      if (this.previousHash === common.ZERO_UINT256) {
        return [this.witness.scriptHash];
      }

      const prevBlock = await context.storage.blocks.tryGet({ hashOrIndex: this.previousHash });
      const prevHeader = prevBlock?.header;
      if (prevHeader === undefined) {
        // TODO: implement this as a makeError InvalidStorageHeaderFetch
        throw new Error(`previous header hash ${this.previousHash} did not return a valid Header from storage`);
      }

      return [prevHeader.nextConsensus];
    },
  );
  // tslint:disable-next-line no-any
  public readonly equals: Equals = utils.equals(this.constructor as any, this, (other: any) =>
    common.uInt256Equal(this.hash, other.hash),
  );
  public readonly toKeyString = utils.toKeyString(BlockBase, () => this.hashHex);
  public readonly serializeUnsigned: SerializeWire = createSerializeWire(this.serializeUnsignedBase);
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase);
  private readonly hashInternal: () => UInt256;
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => createGetHashData(this.serializeUnsigned)());
  private readonly witnessInternal: Witness | undefined;
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      this.witness.size +
      this.sizeExclusive(),
  );

  public constructor({
    version = 0,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    nextConsensus,
    witness,
    hash,
  }: BlockBaseAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.merkleRoot = merkleRoot;
    this.timestamp = timestamp;
    this.index = index;
    this.nextConsensus = nextConsensus;
    this.witnessInternal = witness;
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

  public get witness(): Witness {
    if (this.witnessInternal === undefined) {
      throw new UnsignedBlockError(common.uInt256ToString(this.hash));
    }

    return this.witnessInternal;
  }

  public get witnesses(): readonly Witness[] {
    return [this.witness];
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt256(this.merkleRoot);
    writer.writeUInt64LE(this.timestamp);
    writer.writeUInt32LE(this.index);
    writer.writeUInt160(this.nextConsensus);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeUInt8(1);
    this.witness.serializeWireBase(writer);
  }

  public serializeJSON(context: SerializeJSONContext): BlockBaseJSON {
    return {
      version: this.version,
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      previousblockhash: JSONHelper.writeUInt256(this.previousHash),
      merkleroot: JSONHelper.writeUInt256(this.merkleRoot),
      time: JSONHelper.writeUInt64(this.timestamp),
      index: this.index,
      nextconsensus: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.nextConsensus,
      }),
      witnesses: [this.witness.serializeJSON()],
    };
  }

  public serializeJSONVerbose(
    context: SerializeJSONContext,
    verbose: { readonly confirmations: number; readonly nextblockhash?: UInt256Hex },
  ): BlockBaseJSON {
    return {
      ...this.serializeJSON(context),
      confirmations: verbose.confirmations,
      nextblockhash: verbose.nextblockhash,
    };
  }

  public async verify({ vm, storage, verifyWitnesses, native }: VerifyOptions): Promise<boolean> {
    const prevBlock = await storage.blocks.tryGet({ hashOrIndex: this.previousHash });
    const prevHeader = prevBlock?.header;
    if (prevHeader === undefined) {
      return false;
    }

    if (prevHeader.index + 1 !== this.index) {
      return false;
    }

    if (prevHeader.timestamp.gte(this.timestamp)) {
      return false;
    }

    return verifyWitnesses(vm, this, storage, native, 1);
  }

  protected readonly sizeExclusive: () => number = () => 0;
}
