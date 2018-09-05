import { common, ECPoint, UInt160Hex } from '../common';
import { crypto } from '../crypto';
import { InvalidFormatError, VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import {
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface EnrollmentTransactionAdd extends TransactionBaseAdd {
  readonly publicKey: ECPoint;
}

export interface EnrollmentTransactionJSON extends TransactionBaseJSON {
  readonly type: 'EnrollmentTransaction';
  readonly pubkey: string;
}

export class EnrollmentTransaction extends TransactionBase<TransactionType.Enrollment, EnrollmentTransactionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): EnrollmentTransaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Enrollment) {
      throw new InvalidFormatError();
    }

    const publicKey = reader.readECPoint();

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      publicKey,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  public readonly publicKey: ECPoint;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.publicKey),
  );
  private readonly enrollmentGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor({ version, attributes, inputs, outputs, scripts, hash, publicKey }: EnrollmentTransactionAdd) {
    super({
      version,
      type: TransactionType.Enrollment,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.publicKey = publicKey;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    const getScriptHashesForVerifying = super.getScriptHashesForVerifying.bind(this);
    this.enrollmentGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await getScriptHashesForVerifying(options);

        return new Set([...hashes, common.uInt160ToHex(crypto.getVerificationScriptHash(this.publicKey))]);
      },
    );
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly inputs?: ReadonlyArray<Input>;
    readonly outputs?: ReadonlyArray<Output>;
  }): EnrollmentTransaction {
    return new EnrollmentTransaction({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      publicKey: this.publicKey,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeECPoint(this.publicKey);
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<EnrollmentTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'EnrollmentTransaction',
      pubkey: JSONHelper.writeECPoint(this.publicKey),
    };
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.enrollmentGetScriptHashesForVerifyingInternal(options);
  }

  public async verify(_options: TransactionVerifyOptions): Promise<ReadonlyArray<VerifyScriptResult>> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
