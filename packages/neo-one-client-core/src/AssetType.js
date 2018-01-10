/* @flow */
import { CustomError } from '@neo-one/utils';

export const ASSET_TYPE = {
  CREDIT_FLAG: 0x40,
  DUTY_FLAG: 0x80,
  GOVERNING_TOKEN: 0x00,
  UTILITY_TOKEN: 0x01,
  CURRENCY: 0x08,
  SHARE: 0x90,
  INVOICE: 0x98,
  TOKEN: 0x60,
};

export type AssetType = 0x40 | 0x80 | 0x00 | 0x01 | 0x08 | 0x90 | 0x98 | 0x60;

export const hasFlag = (assetType: AssetType, flag: AssetType): boolean =>
  // eslint-disable-next-line
  (assetType & flag) === flag;

export class InvalidAssetTypeError extends CustomError {
  assetType: number;
  code: string;

  constructor(assetType: number) {
    super(`Expected asset type, found: ${assetType.toString(16)}`);
    this.assetType = assetType;
    this.code = 'INVALID_ASSET_TYPE';
  }
}

export const assertAssetType = (assetType: number): AssetType => {
  switch (assetType) {
    case ASSET_TYPE.CREDIT_FLAG:
      return ASSET_TYPE.CREDIT_FLAG;
    case ASSET_TYPE.DUTY_FLAG:
      return ASSET_TYPE.DUTY_FLAG;
    case ASSET_TYPE.GOVERNING_TOKEN:
      return ASSET_TYPE.GOVERNING_TOKEN;
    case ASSET_TYPE.UTILITY_TOKEN:
      return ASSET_TYPE.UTILITY_TOKEN;
    case ASSET_TYPE.CURRENCY:
      return ASSET_TYPE.CURRENCY;
    case ASSET_TYPE.SHARE:
      return ASSET_TYPE.SHARE;
    case ASSET_TYPE.INVOICE:
      return ASSET_TYPE.INVOICE;
    case ASSET_TYPE.TOKEN:
      return ASSET_TYPE.TOKEN;
    default:
      throw new InvalidAssetTypeError(assetType);
  }
};

export type AssetTypeJSON =
  | 'CreditFlag'
  | 'DutyFlag'
  | 'GoverningToken'
  | 'UtilityToken'
  | 'Currency'
  | 'Share'
  | 'Invoice'
  | 'Token';

export const toJSONAssetType = (type: AssetType): AssetTypeJSON => {
  switch (type) {
    case 0x40:
      return 'CreditFlag';
    case 0x80:
      return 'DutyFlag';
    case 0x00:
      return 'GoverningToken';
    case 0x01:
      return 'UtilityToken';
    case 0x08:
      return 'Currency';
    case 0x90:
      return 'Share';
    case 0x98:
      return 'Invoice';
    case 0x60:
      return 'Token';
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidAssetTypeError(type);
  }
};

export class InvalidAssetTypeJSONError extends CustomError {
  code: string;
  type: string;
  constructor(type: string) {
    super(`Invalid AssetType: ${type}`);
    this.type = type;
    this.code = 'INVALID_ASSET_TYPE_JSON';
  }
}

export const assertAssetTypeJSON = (type: string): AssetTypeJSON => {
  switch (type) {
    case 'CreditFlag':
      return 'CreditFlag';
    case 'DutyFlag':
      return 'DutyFlag';
    case 'GoverningToken':
      return 'GoverningToken';
    case 'UtilityToken':
      return 'UtilityToken';
    case 'Currency':
      return 'Currency';
    case 'Share':
      return 'Share';
    case 'Invoice':
      return 'Invoice';
    case 'Token':
      return 'Token';
    default:
      throw new InvalidAssetTypeJSONError(type);
  }
};

export const toAssetType = (type: AssetTypeJSON): AssetType => {
  switch (type) {
    case 'CreditFlag':
      return 0x40;
    case 'DutyFlag':
      return 0x80;
    case 'GoverningToken':
      return 0x00;
    case 'UtilityToken':
      return 0x01;
    case 'Currency':
      return 0x08;
    case 'Share':
      return 0x90;
    case 'Invoice':
      return 0x98;
    case 'Token':
      return 0x60;
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidAssetTypeJSONError(type);
  }
};
