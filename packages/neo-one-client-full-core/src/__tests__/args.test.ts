import { args as clientArgs, nep5 } from '@neo-one/client-core';
import { data } from '../__data__';
import * as args from '../args';

describe('arg assertions', () => {
  test('assertNullableBigNumber - BigNumber', () => {
    const value = data.bigNumbers.a;

    expect(args.assertNullableBigNumber('value', value)).toEqual(value);
  });

  test('assertNullableBigNumber - undefined', () => {
    const value = undefined;

    expect(args.assertNullableBigNumber('value', value)).toEqual(value);
  });

  test('assertNullableBigNumber - non BigNumber', () => {
    const value = 0;

    expect(() => args.assertNullableBigNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableNumber - number', () => {
    const value = data.numbers.a;

    expect(args.assertNullableNumber('value', value)).toEqual(value);
  });

  test('assertNullableNumber - undefined', () => {
    const value = undefined;

    expect(args.assertNullableNumber('value', value)).toEqual(value);
  });

  test('assertNullableNumber - non number', () => {
    const value = true;

    expect(() => args.assertNullableNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBlockFilter - valid', () => {
    const value = data.blockFilters.valid;

    expect(args.assertBlockFilter('value', value)).toEqual(value);
  });

  test('assertBlockFilter - onlyStart', () => {
    const value = data.blockFilters.onlyStart;

    expect(args.assertBlockFilter('value', value)).toEqual(value);
  });

  test('assertBlockFilter - onlyStop', () => {
    const value = data.blockFilters.onlyStop;

    expect(args.assertBlockFilter('value', value)).toEqual(value);
  });

  test('assertBlockFilter - empty', () => {
    const value = data.blockFilters.empty;

    expect(args.assertBlockFilter('value', value)).toEqual(value);
  });

  test('assertBlockFilter - undefined', () => {
    const value = undefined;

    expect(args.assertBlockFilter('value', value)).toEqual(value);
  });

  test('assertBlockFilter - non object', () => {
    const value = true;

    expect(() => args.assertBlockFilter('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBlockFilter - invalid', () => {
    const value = data.blockFilters.invalid;

    expect(() => args.assertBlockFilter('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertGetOptions - valid', () => {
    const value = data.getOptions.valid;

    expect(args.assertGetOptions('value', value)).toEqual(value);
  });

  test('assertGetOptions - empty', () => {
    const value = data.getOptions.empty;

    expect(args.assertGetOptions('value', value)).toEqual(value);
  });

  test('assertGetOptions - undefined', () => {
    const value = undefined;

    expect(args.assertGetOptions('value', value)).toEqual(value);
  });

  test('assertGetOptions - non object', () => {
    const value = true;

    expect(() => args.assertGetOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAssetRegister - credit', () => {
    const value = data.assetRegisters.credit;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - duty', () => {
    const value = data.assetRegisters.duty;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - governing', () => {
    const value = data.assetRegisters.governing;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - utility', () => {
    const value = data.assetRegisters.utility;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - currency', () => {
    const value = data.assetRegisters.currency;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - share', () => {
    const value = data.assetRegisters.share;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - invoice', () => {
    const value = data.assetRegisters.invoice;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - token', () => {
    const value = data.assetRegisters.token;

    expect(args.assertAssetRegister('value', value)).toEqual(value);
  });

  test('assertAssetRegister - validScriptHash', () => {
    const value = data.assetRegisters.validScriptHash;

    expect(args.assertAssetRegister('value', value)).toEqual(data.assetRegisters.token);
  });

  test('assertAssetRegister - undefined', () => {
    const value = undefined;

    expect(() => args.assertAssetRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAssetRegister - non object', () => {
    const value = true;

    expect(() => args.assertAssetRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAssetRegister - invalid', () => {
    const value = data.assetRegisters.invalid;

    expect(() => args.assertAssetRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertContractRegister - valid', () => {
    const value = data.contractRegisters.valid;

    expect(args.assertContractRegister('value', value)).toEqual(value);
  });

  test('assertContractRegister - undefined', () => {
    const value = undefined;

    expect(() => args.assertContractRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertContractRegister - non object', () => {
    const value = true;

    expect(() => args.assertContractRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertContractRegister - invalid', () => {
    const value = data.contractRegisters.invalid;

    expect(() => args.assertContractRegister('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - nep5', () => {
    const value = nep5.abi(8);

    expect(clientArgs.assertABI('value', value)).toEqual(value);
  });
});
