import { BinaryWriter, createSerializeWire, crypto, InvalidFormatError } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from '../Serializable';
import { BlockchainStorage } from '../Storage';
import { BinaryReader, utils } from '../utils';
import { Verifiable, VerifyWitnesses } from '../Verifiable';
import { VM } from '../vm';
import { Witness } from '../Witness';
import { UnsignedConsensusPayload, UnsignedConsensusPayloadAdd } from './UnsignedConsensusPayload';

interface ConsensusPayloadAdd extends UnsignedConsensusPayloadAdd {
  readonly witness: Witness;
}

export class ConsensusPayload extends UnsignedConsensusPayload implements SerializableWire, Verifiable {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ConsensusPayload {
    const { reader } = options;
    const {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      data,
    } = super.deserializeUnsignedConsensusPayloadWireBase(options);
    const count = reader.readInt8();
    if (count !== 1) {
      throw new InvalidFormatError(`expected exactly 1 witness`);
    }

    const witness = Witness.deserializeWireBase(options);

    return new ConsensusPayload({
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      data,
      witness,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ConsensusPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly witness: Witness;
  public readonly serializeUnsigned = createSerializeWire(this.serializeWireBaseUnsigned);
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly getScriptHashesForVerifying = utils.lazyAsync(async (storage: BlockchainStorage) => {
    const validators = NativeNEO.getNextBlockValidators(storage);
    if (validators.length <= this.validatorIndex) {
      // TODO: implement a real error
      throw new Error(`${validators.length} <= ${this.validatorIndex}`);
    }

    return [crypto.toScriptHash(crypto.createSignatureRedeemScript(validators[this.validatorIndex]))];
  });

  private readonly consensusMessageInternal = utils.lazy(() => ConsensusMessage.deserializeFrom(this.data));

  public constructor(options: ConsensusPayloadAdd) {
    super(options);
    this.witness = options.witness;
  }

  public get witnesses() {
    return [this.witness];
  }

  public get consensusMessage() {
    return this.consensusMessageInternal();
  }

  public serializeWireBase(writer: BinaryWriter) {
    this.serializeWireBaseUnsigned(writer);
    writer.writeUInt8(1);
    this.witness.serializeWireBase(writer);
  }

  public serializeWireBaseUnsigned(writer: BinaryWriter) {
    super.serializeWireBase(writer);
  }

  public async verify(vm: VM, storage: BlockchainStorage, verifyWitnesses: VerifyWitnesses) {
    const blockHashIndex = await storage.blockHashIndex.get();
    const height = blockHashIndex.index;

    if (this.blockIndex <= height) {
      return false;
    }

    return verifyWitnesses(vm, this, storage, 0.02);
  }
}
