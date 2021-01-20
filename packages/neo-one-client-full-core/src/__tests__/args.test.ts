import { args as clientArgs, nep17 } from '@neo-one/client-core';
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

  test('assertIterOptions - valid', () => {
    const value = data.blockFilters.valid;

    expect(args.assertIterOptions('value', value)).toEqual(value);
  });

  test('assertIterOptions - onlyStart', () => {
    const value = data.blockFilters.onlyStart;

    expect(args.assertIterOptions('value', value)).toEqual(value);
  });

  test('assertIterOptions - onlyStop', () => {
    const value = data.blockFilters.onlyStop;

    expect(args.assertIterOptions('value', value)).toEqual(value);
  });

  test('assertIterOptions - empty', () => {
    const value = data.blockFilters.empty;

    expect(args.assertIterOptions('value', value)).toEqual(value);
  });

  test('assertIterOptions - undefined', () => {
    const value = undefined;

    expect(args.assertIterOptions('value', value)).toEqual(value);
  });

  test('assertIterOptions - non object', () => {
    const value = true;

    expect(() => args.assertIterOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertIterOptions - invalid', () => {
    const value = data.blockFilters.invalid;

    expect(() => args.assertIterOptions('value', value)).toThrowErrorMatchingSnapshot();
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

  test('assertABI - nep17', () => {
    const value = nep17.abi(8);

    expect(clientArgs.assertContractABIClient('value', value)).toEqual(value);
  });

  test('assertContractManifest', () => {
    const value = nep17.manifest(8);

    expect(clientArgs.assertContractManifest('value', value)).toEqual(value);
  });
});
