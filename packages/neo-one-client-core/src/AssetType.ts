import { CustomError } from '@neo-one/utils';

export enum AssetType {
  CreditFlag = 0x40,
  DutyFlag = 0x80,
  GoverningToken = 0x00,
  UtilityToken = 0x01,
  Currency = 0x08,
  Share = 0x90,
  Invoice = 0x98,
  Token = 0x60,
}

export const hasFlag = (
  assetType: AssetType,
  flag: AssetType,
  // tslint:disable-next-line
): boolean => (assetType & flag) === flag;

export class InvalidAssetTypeError extends CustomError {
  public readonly assetType: number;
  public readonly code: string;

  public constructor(assetType: number) {
    super(`Expected asset type, found: ${assetType.toString(16)}`);
    this.assetType = assetType;
    this.code = 'INVALID_ASSET_TYPE';
  }
}

const isAssetType = (assetType: number): assetType is AssetType =>
  // tslint:disable-next-line strict-type-predicates
  AssetType[assetType] !== undefined;

export const assertAssetType = (assetType: number): AssetType => {
  if (!isAssetType(assetType)) {
    throw new InvalidAssetTypeError(assetType);
  }

  return assetType;
};

export type AssetTypeJSON = keyof typeof AssetType;

export const toJSONAssetType = (type: AssetType): AssetTypeJSON => assertAssetTypeJSON(AssetType[type]);

export class InvalidAssetTypeJSONError extends CustomError {
  public readonly code: string;
  public readonly type: string;

  public constructor(type: string) {
    super(`Invalid AssetType: ${type}`);
    this.type = type;
    this.code = 'INVALID_ASSET_TYPE_JSON';
  }
}

const isAssetTypeJSON = (assetType: string): assetType is AssetTypeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  AssetType[assetType as any] !== undefined;

export const assertAssetTypeJSON = (type: string): AssetTypeJSON => {
  if (!isAssetTypeJSON(type)) {
    throw new InvalidAssetTypeJSONError(type);
  }

  return type;
};

export const toAssetType = (type: AssetTypeJSON): AssetType => AssetType[type];
