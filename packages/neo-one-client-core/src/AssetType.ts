import { makeErrorWithCode } from '@neo-one/utils';

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

export const InvalidAssetTypeError = makeErrorWithCode(
  'INVALID_ASSET_TYPE',
  (assetType: number) => `Expected asset type, found: ${assetType.toString(16)}`,
);

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

export const InvalidAssetTypeJSONError = makeErrorWithCode(
  'INVALID_ASSET_TYPE_JSON',
  (type: string) => `Invalid AssetType: ${type}`,
);

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
