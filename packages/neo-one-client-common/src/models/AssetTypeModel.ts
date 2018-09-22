import { InvalidAssetTypeError, InvalidAssetTypeJSONError } from '../errors';
import { AssetTypeJSON } from './types';

export enum AssetTypeModel {
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
  assetType: AssetTypeModel,
  flag: AssetTypeModel,
  // tslint:disable-next-line
): boolean => (assetType & flag) === flag;

const isAssetType = (assetType: number): assetType is AssetTypeModel =>
  // tslint:disable-next-line strict-type-predicates
  AssetTypeModel[assetType] !== undefined;

export const assertAssetType = (assetType: number): AssetTypeModel => {
  if (!isAssetType(assetType)) {
    throw new InvalidAssetTypeError(assetType);
  }

  return assetType;
};

export const toJSONAssetType = (type: AssetTypeModel): AssetTypeJSON => assertAssetTypeJSON(AssetTypeModel[type]);

const isAssetTypeJSON = (assetType: string): assetType is AssetTypeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  AssetTypeModel[assetType as any] !== undefined;

export const assertAssetTypeJSON = (type: string): AssetTypeJSON => {
  if (!isAssetTypeJSON(type)) {
    throw new InvalidAssetTypeJSONError(type);
  }

  return type;
};

export const toAssetType = (type: AssetTypeJSON): AssetTypeModel => AssetTypeModel[type];
