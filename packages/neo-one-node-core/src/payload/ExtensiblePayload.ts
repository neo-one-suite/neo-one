import {
  AccountContract,
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  crypto,
  getSignData,
  InvalidFormatError,
  PrivateKey,
} from '@neo-one/client-common';
import { ContractParametersContext } from '../ContractParametersContext';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
} from '../Serializable';
import { VerifyOptions } from '../Verifiable';
import { Witness } from '../Witness';
import { UnsignedExtensiblePayload, UnsignedExtensiblePayloadAdd } from './UnsignedExtensiblePayload';

export interface ExtensiblePayloadAdd extends UnsignedExtensiblePayloadAdd {
  readonly witness: Witness;
}
export class ExtensiblePayload extends UnsignedExtensiblePayload implements SerializableContainer {
  public static sign(payload: UnsignedExtensiblePayload, privateKey: PrivateKey, network: number): ExtensiblePayload {
    const context = new ContractParametersContext(payload.getScriptHashesForVerifying(), network);
    const hashData = getSignData(payload.hash, network);
    const publicKey = crypto.privateKeyToPublicKey(privateKey);
    const signatureContract = AccountContract.createSignatureContract(publicKey);
    const signature = crypto.sign({ message: hashData, privateKey });
    context.addSignature(signatureContract, publicKey, signature);

    return new ExtensiblePayload({
      category: payload.category,
      validBlockStart: payload.validBlockStart,
      validBlockEnd: payload.validBlockEnd,
      sender: payload.sender,
      data: payload.data,
      witness: context.getWitnesses()[0],
      network,
    });
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ExtensiblePayload {
    const { reader } = options;
    const { category, validBlockStart, validBlockEnd, sender, data } =
      super.deserializeUnsignedExtensiblePayloadWireBase(options);
    const count = reader.readInt8();
    if (count !== 1) {
      throw new InvalidFormatError('Expected exactly 1 witness.');
    }

    const witness = Witness.deserializeWireBase(options);

    return new ExtensiblePayload({
      category,
      validBlockEnd,
      validBlockStart,
      sender,
      data,
      witness,
      network: options.context.network,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ExtensiblePayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: SerializableContainerType = 'ExtensiblePayload';
  public readonly witness: Witness;
  public readonly serializeUnsigned = createSerializeWire(this.serializeWireBaseUnsigned);
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor(options: ExtensiblePayloadAdd) {
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

  public async verify(options: VerifyOptions) {
    if (options.height < this.validBlockStart || options.height >= this.validBlockEnd) {
      return false;
    }

    if (!options.extensibleWitnessWhiteList.contains(this.sender)) {
      return false;
    }

    return options.verifyWitnesses({
      vm: options.vm,
      verifiable: this,
      storage: options.storage,
      native: options.native,
      headerCache: options.headerCache,
      gas: common.fixed8FromDecimal('0.06'),
      settings: options.settings,
    });
  }
}
