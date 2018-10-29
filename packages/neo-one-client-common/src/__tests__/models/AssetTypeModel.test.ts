import {
  assertAssetType,
  assertAssetTypeJSON,
  hasFlag,
  toAssetType,
  toJSONAssetType,
} from '../../models/AssetTypeModel';

describe('Asset Type Model - Functions', () => {
  const goodByte = 0x60;
  const goodString = 'Token';

  test('hasFlag', () => {
    expect(hasFlag(goodByte, 0x40)).toEqual(true);
  });
  test('assertAssetType', () => {
    expect(assertAssetType(goodByte)).toEqual(goodByte);
  });
  test('assertAssetTypeJSON', () => {
    expect(assertAssetTypeJSON(goodString)).toEqual(goodString);
  });
  test('toAssetType', () => {
    expect(toAssetType(goodString)).toEqual(goodByte);
  });
  test('toJSONAssetType', () => {
    expect(toJSONAssetType(goodByte)).toEqual(goodString);
  });
});
describe('Asset Type Model - Errors', () => {
  const badByte = 20;
  const badString = '20';

  test('assertAssetType - Bad Byte', () => {
    const assetThrow = () => assertAssetType(badByte);

    expect(assetThrow).toThrowError(`Expected asset type, found: ${badByte.toString(16)}`);
  });

  test('assertAssetTypeJSON - Bad String', () => {
    const assetJSONThrow = () => assertAssetTypeJSON(badString);

    expect(assetJSONThrow).toThrowError(`Invalid AssetType: ${badString}`);
  });
});
