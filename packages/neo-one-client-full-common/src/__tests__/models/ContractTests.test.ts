import { BinaryWriter } from '@neo-one/client-common';
import { assertContractPropertyState, ContractModel, getContractProperties } from '../../models';

describe('Contract Model Tests', () => {
  test('Serialize Wire Base', () => {
    const writer = new BinaryWriter();
    const contractModel = new ContractModel({
      script: Buffer.alloc(25),
      parameterList: [],
      returnType: 0x01,
      contractProperties: 0x01,
      name: 'test',
      codeVersion: '0.0.0',
      author: 'Ben Dover',
      email: 'example@neo-one.gov',
      description: 'test',
    });

    contractModel.serializeWireBase(writer);
    expect(writer.buffer).toMatchSnapshot();
  });
});

describe('Contract Model Property State Tests', () => {
  const badStateValue = 0x10;

  const createBooleanContractProperties = (storageIn?: boolean, invokeIn?: boolean, payableIn?: boolean) => ({
    hasStorage: storageIn === undefined ? false : storageIn,
    hasDynamicInvoke: invokeIn === undefined ? false : invokeIn,
    payable: payableIn === undefined ? false : payableIn,
  });

  test('assertPropertyState throws on bad value', () => {
    expect(() => assertContractPropertyState(badStateValue)).toThrowError(
      `Expected contract parameter type, found: ${badStateValue.toString(16)}`,
    );
  });

  test('getContractProperties - all', () => {
    expect(getContractProperties(createBooleanContractProperties(true, true, true))).toEqual(0x07);
  });
  test('getContractProperties - storage, invoke', () => {
    expect(getContractProperties(createBooleanContractProperties(true, true))).toEqual(0x03);
  });
  test('getContractProperties - invoke, payable', () => {
    expect(getContractProperties(createBooleanContractProperties(false, true, true))).toEqual(0x06);
  });
  test('getContractProperties - invoke', () => {
    expect(getContractProperties(createBooleanContractProperties(false, true))).toEqual(0x02);
  });
  test('getContractProperties - storage', () => {
    expect(getContractProperties(createBooleanContractProperties(true))).toEqual(0x01);
  });
  test('getContractProperties - payable', () => {
    expect(getContractProperties(createBooleanContractProperties(false, false, true))).toEqual(0x04);
  });
  test('getContractProperties - no property', () => {
    expect(getContractProperties(createBooleanContractProperties())).toEqual(0x00);
  });
});
