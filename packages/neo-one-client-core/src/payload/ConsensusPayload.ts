import { common, ECPoint, PrivateKey, UInt256, UInt256Hex } from '../common';
import { crypto } from '../crypto';
import { Equals, EquatableKey } from '../Equatable';
import { InvalidFormatError, VerifyError } from '../errors';
import { ScriptContainerType } from '../ScriptContainer';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from '../Serializable';
import { BinaryReader, BinaryWriter, utils } from '../utils';
import { VerifyScript } from '../vm';
import { Witness } from '../Witness';
import { UnsignedConsensusPayload, UnsignedConsensusPayloadAdd } from './UnsignedConsensusPayload';

export interface ConsensusPayloadAdd extends UnsignedConsensusPayloadAdd {
  readonly script: Witness;
}

export interface ConsensusPayloadGetScriptHashesForVerifyingOptions {
  readonly getValidators: () => Promise<ReadonlyArray<ECPoint>>;
  readonly currentBlockHash: UInt256;
}

export interface ConsensusPayloadVerifyOptions extends ConsensusPayloadGetScriptHashesForVerifyingOptions {
  readonly currentIndex: number;
  readonly verifyScript: VerifyScript;
}

export class ConsensusPayload extends UnsignedConsensusPayload
  implements SerializableWire<ConsensusPayload>, EquatableKey {
  public static sign(payload: UnsignedConsensusPayload, key: PrivateKey): ConsensusPayload {
    return new ConsensusPayload({
      version: payload.version,
      previousHash: payload.previousHash,
      blockIndex: payload.blockIndex,
      validatorIndex: payload.validatorIndex,
      timestamp: payload.timestamp,
      consensusMessage: payload.consensusMessage,
      script: crypto.createWitness(payload.serializeWire(), key),
    });
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ConsensusPayload {
    const { reader } = options;
    const {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
    } = super.deserializeUnsignedConsensusPayloadWireBase(options);
    if (reader.readUInt8() !== 1) {
      throw new InvalidFormatError();
    }
    const script = Witness.deserializeWireBase(options);

    return new this({
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
      script,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ConsensusPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly script: Witness;
  public readonly toKeyString = utils.toKeyString(this.constructor as typeof ConsensusPayload, () => this.hashHex);
  public readonly equals: Equals = utils.equals(this.constructor as typeof ConsensusPayload, this, (other) =>
    common.uInt256Equal(this.hash, other.hash),
  );
  public readonly getScriptHashesForVerifying = utils.lazyAsync(
    async ({ getValidators, currentBlockHash }: ConsensusPayloadGetScriptHashesForVerifyingOptions) => {
      if (!common.uInt256Equal(this.previousHash, currentBlockHash)) {
        throw new VerifyError('Previous hash not equal to current block hash');
      }
      const validators = await getValidators();
      if (validators.length <= this.validatorIndex) {
        throw new VerifyError('Invalid validator index');
      }

      return new Set([common.uInt160ToHex(crypto.getVerificationScriptHash(validators[this.validatorIndex]))]);
    },
  );
  private readonly hashInternal = utils.lazy(() => crypto.hash256(this.message));
  private readonly hashHexInternal = utils.lazy(() => common.uInt256ToHex(this.hash));
  private readonly messageInternal = utils.lazy(() => this.serializeUnsigned());

  public constructor({
    version,
    previousHash,
    blockIndex,
    validatorIndex,
    timestamp,
    consensusMessage,
    script,
  }: ConsensusPayloadAdd) {
    super({
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
    });

    this.script = script;
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

  public serializeUnsigned(): Buffer {
    const writer = new BinaryWriter();
    super.serializeWireBase(writer);

    return writer.toBuffer();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(1);
    this.script.serializeWireBase(writer);
  }

  public async verify({
    verifyScript,
    getValidators,
    currentBlockHash,
    currentIndex,
  }: ConsensusPayloadVerifyOptions): Promise<void> {
    if (this.blockIndex !== currentIndex + 1) {
      throw new VerifyError('Invalid block index.');
    }

    const scriptHashes = await this.getScriptHashesForVerifying({
      getValidators,
      currentBlockHash,
    });

    const scriptContainer: {
      type: ScriptContainerType.Consensus;
      value: ConsensusPayload;
    } = {
      type: ScriptContainerType.Consensus,
      value: this,
    };

    await Promise.all(
      [...scriptHashes].map(async (hash) =>
        verifyScript({
          scriptContainer,
          hash: common.hexToUInt160(hash),
          witness: this.script,
        }),
      ),
    );
  }
}
