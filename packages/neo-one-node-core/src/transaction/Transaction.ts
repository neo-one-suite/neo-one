import {
  AttributeTypeModel,
  BinaryReader,
  common,
  crypto,
  getSignData,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  MAX_TRANSACTION_SIZE,
  multiSignatureContractCost,
  Script,
  scriptHashToAddress,
  signatureContractCost,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  UInt160,
  VerboseTransactionJSON,
  VerifyResultModel,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
} from '../Serializable';
import { Signer } from '../Signer';
import { TransactionVerificationContext } from '../TransactionVerificationContext';
import { utils } from '../utils';
import { maxVerificationGas, Verifiable, VerifyOptions } from '../Verifiable';
import { Witness } from '../Witness';
import { Attribute, deserializeAttribute } from './attributes';

export type TransactionAdd = TransactionModelAdd<Attribute, Witness, Signer>;
export type TransactionAddUnsigned = Omit<TransactionModelAdd<Attribute, Witness, Signer>, 'witnesses'>;

export interface VerboseData {
  readonly blockhash: string;
  readonly confirmations: number;
  readonly blocktime: number;
}

export class Transaction
  extends TransactionModel<Attribute, Witness, Signer>
  implements SerializableContainer, Verifiable
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Transaction {
    const { version, nonce, systemFee, networkFee, validUntilBlock, signers, attributes, script } =
      this.deserializeWireBaseUnsigned(options);
    const { reader } = options;
    const witnesses = reader.readArray(() => Witness.deserializeWireBase(options), signers?.length);
    if (witnesses.length !== signers?.length) {
      throw new InvalidFormatError(
        `Expected witnesses length to equal signers length. Got ${witnesses.length} witnesses and ${signers?.length} signers`,
      );
    }

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
      network: options.context.network,
      maxValidUntilBlockIncrement: options.context.maxValidUntilBlockIncrement,
    });
  }

  public static deserializeWireBaseUnsigned(options: DeserializeWireBaseOptions): TransactionAddUnsigned {
    const { reader } = options;

    const version = reader.readUInt8();
    if (version > 0) {
      throw new InvalidFormatError(`Expected version to equal 0, found: ${version}`);
    }

    const nonce = reader.readUInt32LE();
    const systemFee = reader.readInt64LE();
    if (systemFee.ltn(0)) {
      throw new InvalidFormatError(`Expected systemFee to be greater than 0, found: ${systemFee.toString()}`);
    }

    const networkFee = reader.readInt64LE();
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
      network: options.context.network,
      maxValidUntilBlockIncrement: options.context.maxValidUntilBlockIncrement,
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
      throw new InvalidFormatError(`Expected signer count > 0, found: ${count}`);
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
  public get size() {
    return this.sizeInternal();
  }

  public readonly type: SerializableContainerType = 'Transaction';
  private readonly sizeInternal = utils.lazy(
    () =>
      Transaction.headerSize +
      IOHelper.sizeOfArray(this.signers, (signer) => signer.size) +
      IOHelper.sizeOfArray(this.attributes, (attr) => attr.size) +
      IOHelper.sizeOfVarBytesLE(this.script) +
      IOHelper.sizeOfArray(this.witnesses, (witness) => witness.size),
  );

  public async verifyStateDependent(
    verifyOptions: VerifyOptions,
    transactionContext?: TransactionVerificationContext,
  ): Promise<VerifyResultModel> {
    const { storage, native, verifyWitness, vm, headerCache } = verifyOptions;
    const index = await native.Ledger.currentIndex(storage);
    if (this.validUntilBlock <= index || this.validUntilBlock > index + this.maxValidUntilBlockIncrement) {
      return VerifyResultModel.Expired;
    }

    const hashes = this.getScriptHashesForVerifying();
    const blocked = await Promise.all(hashes.map(async (hash) => native.Policy.isBlocked(storage, hash)));
    if (blocked.some((bool) => bool)) {
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

    const [feePerByte, execFeeFactor] = await Promise.all([
      native.Policy.getFeePerByte(storage),
      native.Policy.getExecFeeFactor(storage),
    ]);

    let netFee = this.networkFee.sub(feePerByte.muln(this.size));
    if (netFee.ltn(0)) {
      return VerifyResultModel.InsufficientFunds;
    }
    if (netFee.gt(maxVerificationGas)) {
      netFee = maxVerificationGas;
    }
    // tslint:disable-next-line: no-loop-statement
    for (let i = 0; i < hashes.length; i += 1) {
      const witness = this.witnesses[i];
      const multiSigResult = crypto.isMultiSigContractWithResult(witness.verification);
      if (multiSigResult.result) {
        const { m, n } = multiSigResult;
        netFee = netFee.sub(new BN(multiSignatureContractCost(m, n).toString(), 10).muln(execFeeFactor));
      } else if (crypto.isSignatureContract(witness.verification)) {
        netFee = netFee.sub(new BN(signatureContractCost.toString(), 10).muln(execFeeFactor));
      } else {
        const { result, gas } = await verifyWitness({
          vm,
          verifiable: this,
          storage,
          native,
          hash: hashes[i],
          witness,
          gas: netFee,
          headerCache,
          settings: verifyOptions.settings,
        });
        if (!result) {
          return VerifyResultModel.InsufficientFunds;
        }
        netFee = netFee.sub(gas);
      }
      if (netFee.ltn(0)) {
        return VerifyResultModel.InsufficientFunds;
      }
    }

    return VerifyResultModel.Succeed;
  }

  public async verifyStateIndependent(verifyOptions: VerifyOptions) {
    const network = verifyOptions.settings?.network ?? this.network;
    if (this.size > MAX_TRANSACTION_SIZE) {
      return VerifyResultModel.Invalid;
    }
    try {
      // tslint:disable-next-line: no-unused-expression
      new Script(this.script, true);
    } catch {
      return VerifyResultModel.Invalid;
    }
    const hashes = this.getScriptHashesForVerifying();
    if (hashes.length !== this.witnesses.length) {
      return VerifyResultModel.Invalid;
    }

    // tslint:disable-next-line: no-loop-statement
    for (let i = 0; i < hashes.length; i += 1) {
      const multiSigResult = crypto.isMultiSigContractWithResult(this.witnesses[i].verification);
      if (crypto.isSignatureContract(this.witnesses[i].verification)) {
        const pubkey = common.bufferToECPoint(this.witnesses[i].verification.slice(2, 35));
        try {
          const signature = this.witnesses[i].invocation.slice(2);
          const signData = getSignData(this.hash, network);
          if (!crypto.verify({ publicKey: pubkey, message: signData, signature })) {
            return VerifyResultModel.Invalid;
          }
        } catch {
          return VerifyResultModel.Invalid;
        }
      } else if (multiSigResult.result) {
        const { points, m } = multiSigResult;
        const signatures = crypto.getMultiSignatures(this.witnesses[i].invocation);
        if (!hashes[i].equals(this.witnesses[i].scriptHash)) {
          return VerifyResultModel.Invalid;
        }
        if (signatures === undefined) {
          // TODO: This check is not in there code but it's possible that their code
          // could throw a null reference exception without this sort of check
          return VerifyResultModel.Invalid;
        }
        if (signatures.length !== m) {
          return VerifyResultModel.Invalid;
        }
        const n = points.length;
        const message = getSignData(this.hash, network);
        try {
          // tslint:disable-next-line: no-loop-statement
          for (let x = 0, y = 0; x < m && y < n; ) {
            if (crypto.verify({ message, signature: signatures[x], publicKey: points[y] })) {
              x += 1;
            }
            y += 1;
            if (m - x > n - y) {
              return VerifyResultModel.Invalid;
            }
          }
        } catch {
          return VerifyResultModel.Invalid;
        }
      }
    }

    return VerifyResultModel.Succeed;
  }

  public async verify(
    verifyOptions: VerifyOptions,
    verifyContext?: TransactionVerificationContext,
  ): Promise<VerifyResultModel> {
    const independentResult = await this.verifyStateIndependent(verifyOptions);
    if (independentResult !== VerifyResultModel.Succeed) {
      return independentResult;
    }

    return this.verifyStateDependent(verifyOptions, verifyContext);
  }

  public serializeJSON(): TransactionJSON {
    return {
      hash: JSONHelper.writeUInt256(this.hash),
      size: this.size,
      version: this.version,
      nonce: this.nonce,
      sender: this.sender ? scriptHashToAddress(common.uInt160ToString(this.sender)) : undefined,
      sysfee: JSONHelper.writeUInt64(this.systemFee),
      netfee: JSONHelper.writeUInt64(this.networkFee),
      validuntilblock: this.validUntilBlock,
      signers: this.signers.map((signer) => signer.serializeJSON()),
      attributes: this.attributes.map((attr) => attr.serializeJSON()),
      script: JSONHelper.writeBase64Buffer(this.script),
      witnesses: this.witnesses.map((witness) => witness.serializeJSON()),
    };
  }

  public serializeJSONWithVerboseData(data: VerboseData): VerboseTransactionJSON {
    const base = this.serializeJSON();

    return {
      ...base,
      blockhash: data.blockhash,
      confirmations: data.confirmations,
      blocktime: data.blocktime,
    };
  }
}
