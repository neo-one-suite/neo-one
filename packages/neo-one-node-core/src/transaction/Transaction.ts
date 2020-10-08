import {
  AttributeTypeModel,
  common,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  MAX_TRANSACTION_SIZE,
  MAX_VALID_UNTIL_BLOCK_INCREMENT,
  scriptHashToAddress,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  UInt160,
  VerifyResultModel,
  VMStateJSON,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from '../Serializable';
import { Signer } from '../Signer';
import { TransactionVerificationContext } from '../TransactionVerificationContext';
import { BinaryReader, utils } from '../utils';
import { Verifiable, VerifyOptions } from '../Verifiable';
import { Witness } from '../Witness';
import { Attribute, deserializeAttribute } from './attributes';

export type TransactionAdd = TransactionModelAdd<Attribute, Witness, Signer>;
export type TransactionAddUnsigned = Omit<TransactionModelAdd<Attribute, Witness, Signer>, 'witnesses'>;

export interface VerboseData {
  readonly blockhash: string;
  readonly confirmations: number;
  readonly blocktime: string;
  readonly vmstate: VMStateJSON;
}

export class Transaction extends TransactionModel<Attribute, Witness, Signer> implements SerializableWire, Verifiable {
  public static readonly headerSize =
    IOHelper.sizeOfUInt8 +
    IOHelper.sizeOfUInt32LE +
    IOHelper.sizeOfUInt64LE +
    IOHelper.sizeOfUInt64LE +
    IOHelper.sizeOfUInt32LE;

  public get size() {
    return this.sizeInternal();
  }
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

  private readonly sizeInternal = utils.lazy(
    () =>
      Transaction.headerSize +
      IOHelper.sizeOfArray(this.signers, (signer) => signer.size) +
      IOHelper.sizeOfArray(this.attributes, (attr) => attr.size) +
      IOHelper.sizeOfVarBytesLE(this.script) +
      IOHelper.sizeOfArray(this.witnesses, (witness) => witness.size),
  );

  public getScriptHashesForVerifying(): readonly UInt160[] {
    return this.signers.map((signer) => signer.account);
  }

  public async verifyForEachBlock(
    verifyOptions: VerifyOptions,
    transactionContext?: TransactionVerificationContext,
  ): Promise<VerifyResultModel> {
    const { storage, native } = verifyOptions;
    const { index } = await storage.blockHashIndex.get();
    if (this.validUntilBlock < index || this.validUntilBlock > index + MAX_VALID_UNTIL_BLOCK_INCREMENT) {
      return VerifyResultModel.Expired;
    }

    const hashes = this.getScriptHashesForVerifying();
    const setHashes = new Set(hashes);
    const blockedAccounts = await native.Policy.getBlockedAccounts(storage);
    if (blockedAccounts.some((account) => setHashes.has(account))) {
      return VerifyResultModel.PolicyFail;
    }

    const maxBlockSysFee = await native.Policy.getMaxBlockSystemFee(storage);
    const sysFee = this.systemFee;
    if (sysFee.gtn(maxBlockSysFee)) {
      return VerifyResultModel.PolicyFail;
    }

    const checkTxPromise = transactionContext?.checkTransaction(this, storage) ?? Promise.resolve(true);
    const checkTx = await checkTxPromise;
    if (!checkTx) {
      return VerifyResultModel.InsufficientFunds;
    }

    const attrVerifications = await Promise.all(this.attributes.map(async (attr) => attr.verify(verifyOptions, this)));
    if (attrVerifications.some((verification) => !verification)) {
      return VerifyResultModel.Invalid;
    }

    if (hashes.length !== this.witnesses.length) {
      return VerifyResultModel.Invalid;
    }

    const verifyHashes = await Promise.all(
      hashes.map(async (hash, idx) => {
        if (this.witnesses[idx].verification.length > 0) {
          return true;
        }
        const state = await storage.contracts.tryGet(hash);

        return state !== undefined;
      }),
    );

    if (verifyHashes.some((value) => !value)) {
      return VerifyResultModel.Invalid;
    }

    return VerifyResultModel.Succeed;
  }

  public async verify(
    verifyOptions: VerifyOptions,
    verifyContext?: TransactionVerificationContext,
  ): Promise<VerifyResultModel> {
    const { native, storage, verifyWitnesses, vm } = verifyOptions;
    const result = await this.verifyForEachBlock(verifyOptions, verifyContext);
    if (result !== VerifyResultModel.Succeed) {
      return result;
    }
    if (this.size > MAX_TRANSACTION_SIZE) {
      return VerifyResultModel.Invalid;
    }
    const feePerByte = await native.Policy.getFeePerByte(storage);
    const netFee = this.networkFee.subn(this.size * feePerByte);
    if (netFee.ltn(0)) {
      return VerifyResultModel.InsufficientFunds;
    }

    const witnessVerify = await verifyWitnesses(vm, this, storage, native, common.fixed8ToDecimal(netFee).toNumber());
    if (!witnessVerify) {
      return VerifyResultModel.Invalid;
    }

    return VerifyResultModel.Succeed;
  }

  public serializeJSON(): TransactionJSON {
    return {
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      version: this.version,
      nonce: this.nonce,
      sender: this.sender ? scriptHashToAddress(common.uInt160ToString(this.sender)) : undefined,
      sysfee: JSONHelper.writeUInt64LE(this.systemFee),
      netfee: JSONHelper.writeUInt64(this.networkFee),
      validuntilblock: this.validUntilBlock,
      signers: this.signers.map((signer) => signer.serializeJSON()),
      attributes: this.attributes.map((attr) => attr.serializeJSON()),
      script: JSONHelper.writeBuffer(this.script),
      witnesses: this.witnesses.map((witness) => witness.serializeJSON()),
    };
  }

  public serializeJSONWithInvocationData(data: VerboseData) {
    const base = this.serializeJSON();

    return {
      ...base,
      blockhash: data.blockhash,
      confirmations: data.confirmations,
      blocktime: data.blocktime,
      vmstate: data.vmstate,
    };
  }
}
