import {
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  crypto,
  HeaderJSON,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  UInt160,
  UInt256,
  UInt256Hex,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { InvalidPreviousHeaderError, UnsignedBlockError } from './errors';
import { NativeContainer } from './Native';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from './Serializable';
import { BlockchainStorage } from './Storage';
import { utils } from './utils';
import { VerifyOptions } from './Verifiable';
import { Witness } from './Witness';

export interface HeaderAdd {
  readonly version?: number;
  readonly previousHash: UInt256;
  readonly merkleRoot: UInt256;
  readonly timestamp: BN;
  readonly index: number;
  readonly nextConsensus: UInt160;
  readonly messageMagic: number;
  readonly witness?: Witness;
  readonly hash?: UInt256;
  readonly primaryIndex: number;
}

export const getBlockScriptHashesForVerifying = async ({
  header,
  storage,
  native,
}: {
  readonly header: { readonly previousHash: UInt256; readonly witness?: Witness; readonly index: number };
  readonly storage: BlockchainStorage;
  readonly native: NativeContainer;
}) => {
  if (common.uInt256Equal(header.previousHash, common.ZERO_UINT256)) {
    const witnessHash = header.witness?.scriptHash;
    if (witnessHash === undefined) {
      throw new InvalidFormatError('Always expect a witness on the genesis block');
    }

    return [witnessHash];
  }

  const prev = await native.Ledger.getTrimmedBlock(storage, header.previousHash);
  if (prev === undefined) {
    throw new InvalidPreviousHeaderError(common.uInt256ToHex(header.previousHash));
  }

  return [prev.header.nextConsensus];
};

export class Header implements SerializableWire, SerializableJSON<HeaderJSON>, SerializableContainer {
  public get size(): number {
    return this.sizeInternal();
  }

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get witnesses(): readonly Witness[] {
    return [this.witness];
  }

  public get witness(): Witness {
    if (this.witnessInternal === undefined) {
      throw new UnsignedBlockError(common.uInt256ToString(this.hash));
    }

    return this.witnessInternal;
  }

  public static deserializeUnsignedHeaderWireBase(options: DeserializeWireBaseOptions): Header {
    const { reader } = options;
    const version = reader.readUInt32LE();
    if (version > 0) {
      throw new InvalidFormatError(`Expected version to be less than 0. Got: ${version}`);
    }
    const previousHash = reader.readUInt256();
    const merkleRoot = reader.readUInt256();
    const timestamp = reader.readUInt64LE();
    const index = reader.readUInt32LE();
    const primaryIndex = reader.readUInt8();
    const nextConsensus = reader.readUInt160();

    return new this({
      hash: undefined,
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      primaryIndex,
      nextConsensus,
      messageMagic: options.context.messageMagic,
    });
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Header {
    const {
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      messageMagic,
      primaryIndex,
    } = this.deserializeUnsignedHeaderWireBase(options);
    const witnesses = options.reader.readArray(() => Witness.deserializeWireBase(options), 1);
    if (witnesses.length !== 1) {
      throw new InvalidFormatError(`Expected only 1 witness. Got: ${witnesses.length}`);
    }

    return new this({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness: witnesses[0],
      messageMagic,
      primaryIndex,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Header {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
  public readonly type: SerializableContainerType = 'Header';
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly serializeUnsigned = createSerializeWire(this.serializeWireUnsignedBase.bind(this));

  public readonly version: number;
  public readonly previousHash: UInt256;
  public readonly merkleRoot: UInt256;
  public readonly timestamp: BN;
  public readonly index: number;
  public readonly nextConsensus: UInt160;
  public readonly messageMagic: number;
  public readonly primaryIndex: number;
  public readonly getScriptHashesForVerifying = utils.lazyAsync(
    async (context: { readonly storage: BlockchainStorage; readonly native: NativeContainer }) =>
      getBlockScriptHashesForVerifying({
        header: this,
        storage: context.storage,
        native: context.native,
      }),
  );

  private readonly witnessInternal: Witness | undefined;
  private readonly hashInternal: () => UInt256;
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      this.witness.size,
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
    messageMagic,
    primaryIndex,
  }: HeaderAdd) {
    this.version = version;
    this.previousHash = previousHash;
    this.merkleRoot = merkleRoot;
    this.timestamp = timestamp;
    this.index = index;
    this.nextConsensus = nextConsensus;
    this.witnessInternal = witness;
    this.messageMagic = messageMagic;
    this.primaryIndex = primaryIndex;
    const hashIn = hash;
    this.hashInternal =
      hashIn === undefined ? utils.lazy(() => crypto.calculateHash(this.serializeUnsigned())) : () => hashIn;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeWireUnsignedBase(writer);
    writer.writeArray(this.witnesses, (witness) => witness.serializeWireBase(writer));
  }

  public serializeWireUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.version);
    writer.writeUInt256(this.previousHash);
    writer.writeUInt256(this.merkleRoot);
    writer.writeUInt64LE(this.timestamp);
    writer.writeUInt32LE(this.index);
    writer.writeUInt8(this.primaryIndex);
    writer.writeUInt160(this.nextConsensus);
  }

  public async verify({ vm, storage, verifyWitnesses, native, settings, headerCache }: VerifyOptions) {
    if (this.primaryIndex >= settings.validatorsCount) {
      return false;
    }

    const prev = await native.Ledger.getTrimmedBlock(storage, this.previousHash);
    if (prev === undefined) {
      return false;
    }

    if (prev.index + 1 !== this.index) {
      return false;
    }

    if (prev.header.timestamp.gte(this.timestamp)) {
      return false;
    }

    const witnessesVerified = await verifyWitnesses({
      vm,
      storage,
      native,
      headerCache,
      gas: utils.ONE,
      verifiable: this,
      settings,
    });

    if (!witnessesVerified) {
      return false;
    }

    return true;
  }

  public async verifyWithHeaderCache(options: VerifyOptions) {
    const { headerCache, verifyWitness, settings, vm, storage, native } = options;
    const prev = headerCache.last;
    if (prev === undefined) {
      return this.verify(options);
    }

    if (this.primaryIndex >= settings.validatorsCount) {
      return false;
    }

    if (!common.uInt256Equal(prev.hash, this.previousHash)) {
      return false;
    }

    if (prev.index + 1 !== this.index) {
      return false;
    }

    if (prev.timestamp.gte(this.timestamp)) {
      return false;
    }

    return verifyWitness({
      vm,
      verifiable: this,
      witness: this.witness,
      storage,
      native,
      hash: prev.nextConsensus,
      headerCache,
      gas: utils.ONE,
      settings,
    });
  }

  public serializeJSON(_context: SerializeJSONContext): HeaderJSON {
    return {
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      version: this.version,
      previousblockhash: JSONHelper.writeUInt256(this.previousHash),
      merkleroot: JSONHelper.writeUInt256(this.merkleRoot),
      time: this.timestamp.toNumber(),
      index: this.index,
      primary: this.primaryIndex,
      nextconsensus: JSONHelper.writeUInt160(this.nextConsensus),
      witnesses: [this.witness.serializeJSON()],
    };
  }

  public serializeJSONVerbose(
    context: SerializeJSONContext,
    verbose: { readonly confirmations: number; readonly nextblockhash?: UInt256Hex },
  ) {
    const base = this.serializeJSON(context);

    return {
      ...base,
      confirmations: verbose.confirmations,
      nextblockhash: verbose.nextblockhash,
    };
  }
}
