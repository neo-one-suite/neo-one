import {
  AccountContract,
  BinaryWriter,
  createSerializeWire,
  crypto,
  ECPoint,
  getHashData,
  InvalidFormatError,
  PrivateKey,
} from '@neo-one/client-common';
import { ContractParametersContext } from '../ContractParametersContext';
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
import { ConsensusMessage } from './message';
import { UnsignedConsensusPayload, UnsignedConsensusPayloadAdd } from './UnsignedConsensusPayload';

export interface ConsensusPayloadAdd extends UnsignedConsensusPayloadAdd {
  readonly witness: Witness;
}

export interface VerifyConsensusPayloadOptions extends VerifyOptions {
  readonly height: number;
}

export class ConsensusPayload extends UnsignedConsensusPayload {
  public static sign(
    payload: UnsignedConsensusPayload,
    privateKey: PrivateKey,
    validators: readonly ECPoint[],
    messageMagic: number,
  ): ConsensusPayload {
    const context = new ContractParametersContext(payload.getScriptHashesForVerifying(validators));
    const hashData = getHashData(payload.serializeWire(), messageMagic);
    const publicKey = crypto.privateKeyToPublicKey(privateKey);
    const signatureContract = AccountContract.createSignatureContract(publicKey);
    const signature = crypto.sign({ message: hashData, privateKey });
    context.addSignature(signatureContract, publicKey, signature);

    return new ConsensusPayload({
      version: payload.version,
      previousHash: payload.previousHash,
      blockIndex: payload.blockIndex,
      validatorIndex: payload.validatorIndex,
      consensusMessage: payload.consensusMessage,
      witness: context.getWitnesses()[0],
      messageMagic,
    });
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ConsensusPayload {
    const { reader, context } = options;
    const {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      data,
    } = super.deserializeUnsignedConsensusPayloadWireBase(options, context.validatorsCount);
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
      messageMagic: options.context.messageMagic,
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

  public getDeserializedMessage<T extends ConsensusMessage>() {
    return this.consensusMessage as T;
  }

  public async verify(options: VerifyConsensusPayloadOptions) {
    if (this.blockIndex <= options.height) {
      return false;
    }

    return options.verifyWitnesses(options.vm, this, options.storage, options.native, 0.02);
  }
}
