import {
  BinaryWriter,
  common,
  crypto,
  ECPoint,
  EnrollmentTransactionJSON,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  TransactionBaseModel,
  UInt160Hex,
} from '@neo-one/client-common';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import {
  TransactionBase,
  TransactionBaseAdd,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface EnrollmentTransactionAdd extends TransactionBaseAdd {
  readonly publicKey: ECPoint;
}

export class EnrollmentTransaction extends TransactionBase<
  TransactionType.Enrollment,
  EnrollmentTransactionJSON,
  Constructor<TransactionBaseModel<TransactionType.Enrollment, Attribute, Input, Output, Witness>>
  // tslint:disable-next-line no-any
>(TransactionBaseModel as any) {
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
    readonly scripts?: readonly Witness[];
    readonly attributes?: readonly Attribute[];
    readonly inputs?: readonly Input[];
    readonly outputs?: readonly Output[];
  }): this {
    // tslint:disable-next-line no-any
    return new (this.constructor as any)({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      publicKey: this.publicKey,
    }) as this;
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

  public async verify(_options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
