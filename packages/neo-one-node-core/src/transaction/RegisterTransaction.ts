import {
  BinaryWriter,
  common,
  crypto,
  ECPoint,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  RegisterTransactionJSON,
  TransactionBaseModel,
  UInt160,
  UInt160Hex,
} from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { BN } from 'bn.js';
import { assertAssetType, AssetType, toJSONAssetType } from '../AssetType';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

interface Asset {
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BN;
  readonly precision: number;
  readonly owner: ECPoint;
  readonly admin: UInt160;
}

export interface RegisterTransactionAdd extends TransactionBaseAdd {
  readonly asset: Asset;
}

export class RegisterTransaction extends TransactionBase<
  TransactionType.Register,
  RegisterTransactionJSON,
  Constructor<TransactionBaseModel<TransactionType.Register, Attribute, Input, Output, Witness>>
  // tslint:disable-next-line no-any
>(TransactionBaseModel as any) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): RegisterTransaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Register) {
      throw new InvalidFormatError(`Expected transaction type ${TransactionType.Register}. Received: ${type}`);
    }

    const assetType = assertAssetType(reader.readUInt8());
    const name = reader.readVarString(1024);
    const amount = reader.readFixed8();
    const precision = reader.readUInt8();
    const owner = reader.readECPoint();
    const admin = reader.readUInt160();

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      asset: {
        type: assetType,
        name,
        amount,
        precision,
        owner,
        admin,
      },
    });
  }

  public readonly asset: Asset;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfVarString(this.asset.name) +
      IOHelper.sizeOfFixed8 +
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfECPoint(this.asset.owner) +
      IOHelper.sizeOfUInt160,
  );
  private readonly registerGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor({ version, attributes, inputs, outputs, scripts, hash, asset }: RegisterTransactionAdd) {
    super({
      version,
      type: TransactionType.Register,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.asset = asset;

    if (this.version !== 0) {
      throw new InvalidFormatError(`Expected version to be 0. Received: ${this.version}`);
    }

    if (
      common.ecPointIsInfinity(asset.owner) &&
      asset.type !== AssetType.GoverningToken &&
      asset.type !== AssetType.UtilityToken
    ) {
      throw new InvalidFormatError(`AssetType and asset owner are invalid`);
    }

    const getScriptHashesForVerifying = super.getScriptHashesForVerifying.bind(this);
    this.registerGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await getScriptHashesForVerifying(options);
        const scriptHash = common.uInt160ToHex(crypto.getVerificationScriptHash(this.asset.owner));

        return new Set([...hashes, scriptHash]);
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
      hash: this.hash,
      asset: this.asset,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.asset.type);
    writer.writeVarString(this.asset.name);
    writer.writeFixed8(this.asset.amount);
    writer.writeUInt8(this.asset.precision);
    writer.writeECPoint(this.asset.owner);
    writer.writeUInt160(this.asset.admin);
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<RegisterTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    let { name } = this.asset;
    try {
      name = JSON.parse(name);
    } catch {
      // ignore errors
    }

    return {
      ...transactionBaseJSON,
      type: 'RegisterTransaction',
      asset: {
        type: toJSONAssetType(this.asset.type),
        name,
        amount: JSONHelper.writeFixed8(this.asset.amount),
        precision: this.asset.precision,
        owner: JSONHelper.writeECPoint(this.asset.owner),
        admin: crypto.scriptHashToAddress({
          addressVersion: context.addressVersion,
          scriptHash: this.asset.admin,
        }),
      },
    };
  }

  public getSystemFee(context: FeeContext): BN {
    if (this.asset.type === AssetType.GoverningToken || this.asset.type === AssetType.UtilityToken) {
      return utils.ZERO;
    }

    return super.getSystemFee(context);
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.registerGetScriptHashesForVerifyingInternal(options);
  }

  public async verify(_options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    throw new VerifyError('Register transactions are obsolete');
  }
}
