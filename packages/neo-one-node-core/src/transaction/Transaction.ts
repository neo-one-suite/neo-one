import {
  AttributeTypeModel,
  BinaryReader,
  common,
  ConfirmedTransactionJSON,
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
  TransactionDataJSON,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  UInt160,
  VerifyResultModel,
  VerifyResultModelExtended,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
  SerializeJSONContext,
} from '../Serializable';
import { Signer } from '../Signer';
import { TransactionVerificationContext } from '../TransactionVerificationContext';
import { utils } from '../utils';
import { maxVerificationGas, Verifiable, VerifyOptions } from '../Verifiable';
import { Witness } from '../Witness';
import { Attribute, deserializeAttribute } from './attributes';

export type TransactionAdd = TransactionModelAdd<Attribute, Witness, Signer>;
export type TransactionAddUnsigned = Omit<TransactionModelAdd<Attribute, Witness, Signer>, 'witnesses'>;

export interface TransactionDataAddOn {
  readonly blockHash: string;
  readonly blockIndex: number;
  readonly transactionIndex: number;
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
  ): Promise<VerifyResultModelExtended> {
    const { storage, native, verifyWitness, vm, headerCache } = verifyOptions;
    const index = await native.Ledger.currentIndex(storage);
    if (this.validUntilBlock <= index) {
      return {
        verifyResult: VerifyResultModel.Expired,
        failureReason: `Transaction is expired. Current index ${index} is greater than validUntilBlock ${this.validUntilBlock}`,
      };
    }

    if (this.validUntilBlock > index + this.maxValidUntilBlockIncrement) {
      return {
        verifyResult: VerifyResultModel.Expired,
        failureReason: `Transaction is expired. Current index ${index} plus maxValidUntilBlockIncrement ${this.maxValidUntilBlockIncrement} is less than validUntilBlock ${this.validUntilBlock}`,
      };
    }

    const hashes = this.getScriptHashesForVerifying();
    const blockedHashes: UInt160[] = [];
    const blocked = await Promise.all(
      hashes.map(async (hash) => {
        const isBlocked = await native.Policy.isBlocked(storage, hash);
        if (isBlocked) {
          // tslint:disable-next-line: no-array-mutation
          blockedHashes.push(hash);
        }

        return isBlocked;
      }),
    );
    if (blocked.some((bool) => bool)) {
      return {
        verifyResult: VerifyResultModel.PolicyFail,
        failureReason: `The following signers are blocked: ${blockedHashes
          .map((hash) => common.uInt160ToString(hash))
          .join(', ')}`,
      };
    }

    const checkTxPromise = transactionContext?.checkTransaction(this, storage) ?? Promise.resolve({ result: true });
    const checkTx = await checkTxPromise;
    if (!checkTx.result) {
      return { verifyResult: VerifyResultModel.InsufficientFunds, failureReason: checkTx.failureReason };
    }

    const failedAttributes: Attribute[] = [];
    const attrVerifications = await Promise.all(
      this.attributes.map(async (attr) => {
        const verification = await attr.verify(verifyOptions, this);
        if (!verification) {
          // tslint:disable-next-line: no-array-mutation
          failedAttributes.push(attr);
        }

        return verification;
      }),
    );
    if (attrVerifications.some((verification) => !verification)) {
      return {
        verifyResult: VerifyResultModel.Invalid,
        failureReason: `The following attributes failed verification: ${failedAttributes
          .map((attr) => JSON.stringify(attr.serializeJSON()))
          .join(', ')}`,
      };
    }

    const [feePerByte, execFeeFactor] = await Promise.all([
      native.Policy.getFeePerByte(storage),
      native.Policy.getExecFeeFactor(storage),
    ]);

    const feeNeeded = feePerByte.muln(this.size);
    let netFee = this.networkFee.sub(feeNeeded);
    if (netFee.ltn(0)) {
      return {
        verifyResult: VerifyResultModel.InsufficientFunds,
        failureReason: `Insufficient network fee. Transaction size ${
          this.size
        } times fee per byte of ${feePerByte.toString()} = ${feeNeeded.toString()} is greater than attached network fee ${this.networkFee.toString()}`,
      };
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
        const { result, gas, failureReason } = await verifyWitness({
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
          return {
            verifyResult: VerifyResultModel.InsufficientFunds,
            failureReason: `Witness verification failed for witness ${common.uInt160ToString(
              witness.scriptHash,
            )}. Reason: ${failureReason}.`,
          };
        }
        netFee = netFee.sub(gas);
      }
      if (netFee.ltn(0)) {
        return {
          verifyResult: VerifyResultModel.InsufficientFunds,
          failureReason: `Insufficient network fee while verifying witnesses. Try adding ${netFee
            .neg()
            .toString()} to network fee`,
        };
      }
    }

    return { verifyResult: VerifyResultModel.Succeed };
  }

  public async verifyStateIndependent(verifyOptions: VerifyOptions): Promise<VerifyResultModelExtended> {
    const network = verifyOptions.settings?.network ?? this.network;
    if (this.size > MAX_TRANSACTION_SIZE) {
      return { verifyResult: VerifyResultModel.Invalid, failureReason: '' };
    }
    try {
      // tslint:disable-next-line: no-unused-expression
      new Script(this.script, true);
    } catch (error) {
      return {
        verifyResult: VerifyResultModel.Invalid,
        failureReason: `Transaction script is invalid: ${error.message}`,
      };
    }
    const hashes = this.getScriptHashesForVerifying();
    if (hashes.length !== this.witnesses.length) {
      return {
        verifyResult: VerifyResultModel.Invalid,
        failureReason: `Expected hashes length ${hashes.length} to equal witnesses length ${this.witnesses.length}`,
      };
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
            return { verifyResult: VerifyResultModel.Invalid, failureReason: 'Signature verification failed' };
          }
        } catch (error) {
          return {
            verifyResult: VerifyResultModel.Invalid,
            failureReason: `Signature verification failed: ${error.message}`,
          };
        }
      } else if (multiSigResult.result) {
        const { points, m } = multiSigResult;
        const signatures = crypto.getMultiSignatures(this.witnesses[i].invocation);
        if (!hashes[i].equals(this.witnesses[i].scriptHash)) {
          return {
            verifyResult: VerifyResultModel.Invalid,
            failureReason: `Expected witness scripthash ${common.uInt160ToString(
              this.witnesses[i].scriptHash,
            )} to equal ${common.uInt160ToString(hashes[i])}`,
          };
        }
        if (signatures === undefined) {
          // This check is not in there code but it's possible that their code
          // could throw a null reference exception without this sort of check
          return {
            verifyResult: VerifyResultModel.Invalid,
            failureReason: 'Expected witness invocation signature to be defined',
          };
        }
        if (signatures.length !== m) {
          return {
            verifyResult: VerifyResultModel.Invalid,
            failureReason: `Expected signatures length ${signatures.length} to equal witness verification script result length ${m}`,
          };
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
              return {
                verifyResult: VerifyResultModel.Invalid,
                failureReason: 'Error while verifying invocation signature',
              };
            }
          }
        } catch (error) {
          return {
            verifyResult: VerifyResultModel.Invalid,
            failureReason: `Error while verifying invocation signatures: ${error.message}`,
          };
        }
      }
    }

    return { verifyResult: VerifyResultModel.Succeed };
  }

  public async verify(
    verifyOptions: VerifyOptions,
    verifyContext?: TransactionVerificationContext,
  ): Promise<VerifyResultModelExtended> {
    const independentResult = await this.verifyStateIndependent(verifyOptions);
    if (independentResult.verifyResult !== VerifyResultModel.Succeed) {
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
      sysfee: JSONHelper.writeFixed8(this.systemFee),
      netfee: JSONHelper.writeFixed8(this.networkFee),
      validuntilblock: this.validUntilBlock,
      signers: this.signers.map((signer) => signer.serializeJSON()),
      attributes: this.attributes.map((attr) => attr.serializeJSON()),
      script: JSONHelper.writeBase64Buffer(this.script),
      witnesses: this.witnesses.map((witness) => witness.serializeJSON()),
    };
  }

  public async serializeJSONWithData(context: SerializeJSONContext): Promise<ConfirmedTransactionJSON> {
    const base = this.serializeJSON();
    const data = await context.tryGetTransactionData(this.hash);
    let transactionData: TransactionDataJSON | undefined;
    if (data !== undefined) {
      transactionData = {
        blockIndex: data.blockIndex,
        blockHash: JSONHelper.writeUInt256(data.blockHash),
        globalIndex: JSONHelper.writeUInt64(data.globalIndex),
        transactionIndex: data.transactionIndex,
        deletedContractHashes: data.deletedContractHashes.map((hash) => JSONHelper.writeUInt160(hash)),
        deployedContracts: data.deployedContracts.map((c) => c.serializeJSON()),
        updatedContracts: data.updatedContracts.map((c) => c.serializeJSON()),
        executionResult: data.executionResult.serializeJSON(),
        actions: data.actions.map((action) => action.serializeJSON()),
      };
    }

    return {
      ...base,
      transactionData,
    };
  }
}
