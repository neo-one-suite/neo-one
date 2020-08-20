import {
  AttributeTypeModel,
  common,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  scriptHashToAddress,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  UInt160,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
} from '../Serializable';
import { Signer } from '../Signer';
import { BinaryReader, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute, deserializeAttribute } from './attributes';

export type TransactionAddUnsigned = Omit<TransactionModelAdd<Attribute, Witness, Signer>, 'witnesses'>;
export type TransactionAdd = TransactionModelAdd<Attribute, Witness, Signer>;

export class Transaction extends TransactionModel<Attribute, Witness, Signer>
  implements SerializableWire<Transaction>, SerializableJSON<TransactionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Transaction {
    const {
      version,
      nonce,
      systemFee,
      networkFee,
      validUntilBlock,
      signers,
      attributes,
      script,
    } = this.deserializeWireBaseUnsigned(options);
    const { reader } = options;
    const witnesses = reader.readArray(() => Witness.deserializeWireBase(options));

    return new Transaction({
      version,
      nonce,
      systemFee,
      networkFee,
      validUntilBlock,
      signers,
      attributes,
      script,
      witnesses,
    });
  }

  public static deserializeWireBaseUnsigned(options: DeserializeWireBaseOptions): TransactionAddUnsigned {
    const { reader } = options;

    const version = reader.readUInt8();
    if (version > 0) {
      throw new InvalidFormatError(`Expected version to equal 0, found: ${version}`);
    }

    const nonce = reader.readUInt32LE();
    const systemFee = reader.readUInt64LE();
    if (systemFee.ltn(0)) {
      throw new InvalidFormatError(`Expected systemFee to be greater than 0, found: ${systemFee.toString()}`);
    }

    const networkFee = reader.readUInt64LE();
    if (networkFee.ltn(0)) {
      throw new InvalidFormatError(`Expected networkFee to be greater than 0, found: ${networkFee.toString()}`);
    }

    if (systemFee.add(networkFee).lt(systemFee)) {
      throw new InvalidFormatError();
    }

    const validUntilBlock = reader.readUInt32LE();
    const signers = this.deserializeSigners(options, this.maxTransactionAttributes);
    const attributes = this.deserializeAttributes(options, this.maxTransactionAttributes - signers.length);
    const script = reader.readVarBytesLE(utils.USHORT_MAX.toNumber());
    if (script.length === 0) {
      throw new InvalidFormatError(`Expected script length to be greater than 0, found: ${script.length}`);
    }

    return {
      version,
      nonce,
      systemFee,
      networkFee,
      validUntilBlock,
      signers,
      attributes,
      script,
    };
  }

  public static deserializeWire(options: DeserializeWireOptions): Transaction {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private static deserializeSigners(options: DeserializeWireBaseOptions, maxCount: number) {
    const { reader } = options;
    const count = reader.readVarUIntLE(new BN(maxCount)).toNumber();
    if (count === 0) {
      throw new InvalidFormatError(`expected signer count > 0, found: ${count}`);
    }

    const signerSet = new Set<UInt160>();

    return _.range(count).map(() => {
      const signer = Signer.deserializeWireBase(options);
      if (signerSet.has(signer.account)) {
        throw new InvalidFormatError(`Expected signers to be unique, found repeat: ${signer}`);
      }

      signerSet.add(signer.account);

      return signer;
    });
  }

  private static deserializeAttributes(options: DeserializeWireBaseOptions, maxCount: number) {
    const { reader } = options;
    const count = reader.readVarUIntLE(new BN(maxCount)).toNumber();

    const attributeSet = new Set<AttributeTypeModel>();

    return _.range(count).map(() => {
      const attribute = deserializeAttribute(options);
      if (!attribute.allowMultiple && attributeSet.has(attribute.type)) {
        throw new InvalidFormatError(`Only 1 ${attribute.type} attribute allowed, found at least 2`);
      }

      attributeSet.add(attribute.type);

      return attribute;
    });
  }

  private readonly headerSizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt64LE +
      IOHelper.sizeOfUInt32LE,
  );

  private readonly sizeInternal = utils.lazy(
    () =>
      this.headerSize +
      IOHelper.sizeOfArray(this.signers, (signer) => signer.size) +
      IOHelper.sizeOfArray(this.attributes, (attr) => attr.size) +
      IOHelper.sizeOfVarBytesLE(this.script) +
      IOHelper.sizeOfArray(this.witnesses, (witness) => witness.size),
  );

  public get headerSize() {
    return this.headerSizeInternal();
  }

  public get size() {
    return this.sizeInternal();
  }

  public serializeJSON(options: SerializeJSONContext): TransactionJSON {
    return {
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      version: this.version,
      nonce: this.nonce,
      sender: scriptHashToAddress(common.uInt160ToString(this.sender)),
      sysfee: JSONHelper.writeUInt64LE(this.systemFee),
      netfee: JSONHelper.writeUInt64LE(this.networkFee),
      validuntilblock: this.validUntilBlock,
      signers: this.signers.map((signer) => signer.serializeJSON(options)),
      attributes: this.attributes.map((attr) => attr.serializeJSON(options)),
      script: JSONHelper.writeBuffer(this.script),
      witnesses: this.witnesses.map((witness) => witness.serializeJSON(options)),
    };
  }
}
