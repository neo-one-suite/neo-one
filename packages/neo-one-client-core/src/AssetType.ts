import _ from 'lodash';
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

  constructor(assetType: number) {
    super(`Expected asset type, found: ${assetType.toString(16)}`);
    this.assetType = assetType;
    this.code = 'INVALID_ASSET_TYPE';
  }
}

const isAssetType = (assetType: number): assetType is AssetType =>
  AssetType[assetType] != null;

export const assertAssetType = (assetType: number): AssetType => {
  if (!isAssetType(assetType)) {
    throw new InvalidAssetTypeError(assetType);
  }

  return assetType;
};

export type AssetTypeJSON = keyof typeof AssetType;

export const toJSONAssetType = (type: AssetType): AssetTypeJSON =>
  assertAssetTypeJSON(AssetType[type]);

export class InvalidAssetTypeJSONError extends CustomError {
  public readonly code: string;
  public readonly type: string;

  constructor(type: string) {
    super(`Invalid AssetType: ${type}`);
    this.type = type;
    this.code = 'INVALID_ASSET_TYPE_JSON';
  }
}

const isAssetTypeJSON = (assetType: string): assetType is AssetTypeJSON =>
  AssetType[assetType as any] != null;

export const assertAssetTypeJSON = (type: string): AssetTypeJSON => {
  if (!isAssetTypeJSON(type)) {
    throw new InvalidAssetTypeJSONError(type);
  }

  return type;
};

const JSONToAssetType: { [K in AssetTypeJSON]: AssetType } = _.invert(
  AssetType,
) as any;

export const toAssetType = (type: AssetTypeJSON): AssetType =>
  JSONToAssetType[type];
