import { makeErrorWithCode } from '@neo-one/utils';
import { BN } from 'bn.js';
import { assertAssetType, AssetType, AssetTypeJSON, toJSONAssetType } from './AssetType';
import { BaseState } from './BaseState';
import { common, ECPoint, UInt160, UInt256, UInt256Hex } from './common';
import { crypto } from './crypto';
import { Equals, Equatable } from './Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from './utils';

export const InvalidAssetError = makeErrorWithCode('INVALID_ASSET', (message: string) => message);

export interface AssetKey {
  readonly hash: UInt256;
}
export interface AssetAdd {
  readonly version?: number;
  readonly hash: UInt256;
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BN;
  readonly available?: BN;
  readonly precision: number;
  readonly feeMode?: number;
  readonly fee?: BN;
  readonly feeAddress?: UInt160;
  readonly owner: ECPoint;
  readonly admin: UInt160;
  readonly issuer: UInt160;
  readonly expiration: number;
  readonly isFrozen?: boolean;
}

export interface AssetUpdate {
  readonly available?: BN;
  readonly expiration?: number;
  readonly isFrozen?: boolean;
}

export type AssetNameJSON = string | ReadonlyArray<{ readonly lang: string; readonly name: string }>;

export interface AssetJSON {
  readonly version: number;
  readonly id: string;
  readonly type: AssetTypeJSON;
  readonly name: AssetNameJSON;
  readonly amount: string;
  readonly available: string;
  readonly precision: number;
  readonly owner: string;
  readonly admin: string;
  readonly issuer: string;
  readonly expiration: number;
  readonly frozen: boolean;
}

const NAME_MAX_LENGTH = 1024;
const PRECISION_MAX = 8;

export class Asset extends BaseState implements SerializableWire<Asset>, SerializableJSON<AssetJSON>, Equatable {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Asset {
    const version = reader.readUInt8();
    const hash = reader.readUInt256();
    const type = assertAssetType(reader.readUInt8());
    const name = reader.readVarString();
    const amount = reader.readFixed8();
    const available = reader.readFixed8();
    const precision = reader.readUInt8();
    reader.readUInt8(); // FeeMode
    const fee = reader.readFixed8();
    const feeAddress = reader.readUInt160();
    const owner = reader.readECPoint();
    const admin = reader.readUInt160();
    const issuer = reader.readUInt160();
    const expiration = reader.readUInt32LE();
    const isFrozen = reader.readBoolean();

    return new Asset({
      version,
      hash,
      type,
      name,
      amount,
      available,
      precision,
      fee,
      feeAddress,
      owner,
      admin,
      issuer,
      expiration,
      isFrozen,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Asset {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly hashHex: UInt256Hex;
  public readonly type: AssetType;
  public readonly name: string;
  public readonly amount: BN;
  public readonly available: BN;
  public readonly precision: number;
  public readonly feeMode: number;
  public readonly fee: BN;
  public readonly feeAddress: UInt160;
  public readonly owner: ECPoint;
  public readonly admin: UInt160;
  public readonly issuer: UInt160;
  public readonly expiration: number;
  public readonly isFrozen: boolean;
  public readonly equals: Equals = utils.equals(Asset, this, (other) => common.uInt256Equal(this.hash, other.hash));
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({
    version,
    hash,
    type,
    name,
    amount,
    available = utils.ZERO,
    precision,
    feeMode = 0,
    fee = utils.ZERO,
    feeAddress = common.ZERO_UINT160,
    owner,
    admin,
    issuer,
    expiration,
    isFrozen = false,
  }: AssetAdd) {
    super({ version });
    // tslint:disable-next-line
    verifyAsset({ name, type, amount, precision });
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.type = type;
    this.name = name;
    this.amount = amount;
    this.available = available;
    this.precision = precision;
    this.feeMode = feeMode;
    this.fee = fee;
    this.feeAddress = feeAddress;
    this.owner = owner;
    this.admin = admin;
    this.issuer = issuer;
    this.expiration = expiration;
    this.isFrozen = isFrozen;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfVarString(this.name) +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfECPoint(this.owner) +
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfBoolean,
    );
  }
  public get size(): number {
    return this.sizeInternal();
  }

  public update({
    available = this.available,
    expiration = this.expiration,
    isFrozen = this.isFrozen,
  }: AssetUpdate): Asset {
    return new Asset({
      hash: this.hash,
      type: this.type,
      name: this.name,
      amount: this.amount,
      precision: this.precision,
      fee: this.fee,
      feeAddress: this.feeAddress,
      owner: this.owner,
      admin: this.admin,
      issuer: this.issuer,
      available,
      expiration,
      isFrozen,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt256(this.hash);
    writer.writeUInt8(this.type);
    writer.writeVarString(this.name);
    writer.writeFixed8(this.amount);
    writer.writeFixed8(this.available);
    writer.writeUInt8(this.precision);
    writer.writeUInt8(this.feeMode);
    writer.writeFixed8(this.fee);
    writer.writeUInt160(this.feeAddress);
    writer.writeECPoint(this.owner);
    writer.writeUInt160(this.admin);
    writer.writeUInt160(this.issuer);
    writer.writeUInt32LE(this.expiration);
    writer.writeBoolean(this.isFrozen);
  }

  public serializeJSON(context: SerializeJSONContext): AssetJSON {
    let name = this.name;
    try {
      name = JSON.parse(name);
    } catch {
      // Ignore errors
    }

    return {
      version: this.version,
      id: JSONHelper.writeUInt256(this.hash),
      type: toJSONAssetType(this.type),
      name,
      amount: JSONHelper.writeFixed8(this.amount),
      available: JSONHelper.writeFixed8(this.available),
      precision: this.precision,
      owner: JSONHelper.writeECPoint(this.owner),
      admin: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.admin,
      }),

      issuer: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.issuer,
      }),

      expiration: this.expiration,
      frozen: this.isFrozen,
    };
  }
}

export const verifyAsset = ({
  name,
  type,
  amount,
  precision,
}: {
  readonly name: AssetAdd['name'];
  readonly type: AssetAdd['type'];
  readonly amount: AssetAdd['amount'];
  readonly precision: AssetAdd['precision'];
}) => {
  if (type === AssetType.CreditFlag || type === AssetType.DutyFlag) {
    throw new InvalidAssetError(`Asset type cannot be CREDIT_FLAG or DUTY_FLAG, received: ${type}`);
  }

  const nameBuffer = Buffer.from(name, 'utf8');
  if (nameBuffer.length > NAME_MAX_LENGTH) {
    throw new InvalidAssetError(`Name too long. Max: ${NAME_MAX_LENGTH}, Received: ${nameBuffer.length}`);
  }

  if (amount.lte(utils.ZERO) && !amount.eq(common.NEGATIVE_SATOSHI_FIXED8)) {
    throw new InvalidAssetError(`Amount must be greater than 0. (received ${amount})`);
  }

  if (type === AssetType.Invoice && !amount.eq(common.NEGATIVE_SATOSHI_FIXED8)) {
    throw new InvalidAssetError('Invoice assets must have unlimited amount.');
  }

  if (precision > PRECISION_MAX) {
    throw new InvalidAssetError(`Max precision is 8. Received: ${precision}`);
  }

  if (!amount.eq(utils.NEGATIVE_SATOSHI) && !amount.mod(utils.TEN.pow(utils.EIGHT.subn(precision))).eq(utils.ZERO)) {
    throw new InvalidAssetError('Invalid precision for amount.');
  }
};
