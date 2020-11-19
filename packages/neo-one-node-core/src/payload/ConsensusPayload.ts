import { BinaryWriter, createSerializeWire, crypto, InvalidFormatError } from '@neo-one/client-common';
import { NativeContainer } from '../Native';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
} from '../Serializable';
import { BlockchainStorage } from '../Storage';
import { BinaryReader, utils } from '../utils';
import { Verifiable, VerifyOptions } from '../Verifiable';
import { Witness } from '../Witness';
import { UnsignedConsensusPayload, UnsignedConsensusPayloadAdd } from './UnsignedConsensusPayload';

export interface ConsensusPayloadAdd extends UnsignedConsensusPayloadAdd {
  readonly witness: Witness;
}

export interface VerifyConsensusPayloadOptions extends VerifyOptions {
  readonly height: number;
}

export class ConsensusPayload extends UnsignedConsensusPayload implements SerializableContainer, Verifiable {
  public static deserializeWireBase(options: DeserializeWireBaseOptions, validatorsCount = 7): ConsensusPayload {
    const { reader } = options;
    const {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      data,
    } = super.deserializeUnsignedConsensusPayloadWireBase(options, validatorsCount);
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
      magic: options.context.messageMagic,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ConsensusPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: SerializableContainerType = 'ConsensusPayload';
  public readonly witness: Witness;
  public readonly serializeUnsigned = createSerializeWire(this.serializeWireBaseUnsigned);
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly getScriptHashesForVerifying = utils.lazyAsync(
    async (context: { readonly storage: BlockchainStorage; readonly native: NativeContainer }) => {
      const validators = await context.native.NEO.getNextBlockValidators(context.storage);
      if (validators.length <= this.validatorIndex) {
        // TODO: implement a real error
        throw new Error(`${validators.length} <= ${this.validatorIndex}`);
      }

      return [crypto.toScriptHash(crypto.createSignatureRedeemScript(validators[this.validatorIndex]))];
    },
  );

  public constructor(options: ConsensusPayloadAdd) {
    super(options);
    this.witness = options.witness;
  }

  public get witnesses() {
    return [this.witness];
  }

  public serializeWireBase(writer: BinaryWriter) {
    this.serializeWireBaseUnsigned(writer);
    writer.writeUInt8(1);
    this.witness.serializeWireBase(writer);
  }

  public serializeWireBaseUnsigned(writer: BinaryWriter) {
    super.serializeWireBase(writer);
  }

  public async verify(options: VerifyConsensusPayloadOptions) {
    if (this.blockIndex <= options.height) {
      return false;
    }

    return options.verifyWitnesses(options.vm, this, options.storage, options.native, 0.02);
  }
}
