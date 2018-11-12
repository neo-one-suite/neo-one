import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';
import { factory } from '../../__data__/factory';
import { keys } from '../../__data__/keys';
import { convertContractParameter, convertInvocationResult } from '../../provider/convert';

describe('Convert Provider Helper Tests', () => {
  test('convertInvocationResult - FaultState', () => {
    const value = '0';
    const invokeResult = factory.createInvocationResultErrorJSON({
      stack: [factory.createIntegerContractParameterJSON({ value })],
    });
    const result = convertInvocationResult(invokeResult);

    expect(result.state).toEqual('FAULT');
    if (result.state !== 'FAULT') {
      throw new Error('For TS');
    }
    expect(result.gasConsumed).toEqual(new BigNumber(invokeResult.gas_consumed));
    expect(result.gasCost).toEqual(new BigNumber(invokeResult.gas_cost));
    expect(result.stack).toEqual(invokeResult.stack.map(convertContractParameter));
    expect(result.message).toEqual(invokeResult.message);
  });

  test('convertContractParameter - Array', () => {
    const integerJSON = factory.createIntegerContractParameterJSON();
    const arrayJSON = factory.createArrayContractParameterJSON({
      value: [integerJSON],
    });

    expect(convertContractParameter(arrayJSON)).toEqual({
      type: 'Array',
      value: [convertContractParameter(integerJSON)],
    });
  });

  test('convertContractParameter - Boolean', () => {
    const booleanJSON = factory.createBooleanContractParameterJSON();

    expect(convertContractParameter(booleanJSON)).toEqual(booleanJSON);
  });

  test('convertContractParameter - Hash256', () => {
    const hash256JSON = factory.createHash256ContractParameterJSON();

    expect(convertContractParameter(hash256JSON)).toEqual(hash256JSON);
  });

  test('convertContractParameter - Integer', () => {
    const integerJSON = factory.createIntegerContractParameterJSON();

    expect(convertContractParameter(integerJSON)).toEqual({
      type: 'Integer',
      value: new BN(integerJSON.value, 10),
    });
  });

  test('convertContractParameter - Interop Interface', () => {
    const interopJSON = factory.createInteropInterfaceContractParameterJSON();

    expect(convertContractParameter(interopJSON)).toEqual(interopJSON);
  });

  test('convertContractParameter - Public Key', () => {
    const publicKeyJSON = factory.createPublicKeyContractParameterJSON();

    expect(convertContractParameter(publicKeyJSON)).toEqual(publicKeyJSON);
  });

  test('convertContractParameter - Signature', () => {
    const signatureJSON = factory.createSignatureContractParameterJSON();

    expect(convertContractParameter(signatureJSON)).toEqual(signatureJSON);
  });

  test('convertContractParameter - String', () => {
    const stringJSON = factory.createStringContractParameterJSON();

    expect(convertContractParameter(stringJSON)).toEqual(stringJSON);
  });

  test('convertContractParameter - Void', () => {
    const voidJSON = factory.createVoidContractParameterJSON();

    expect(convertContractParameter(voidJSON)).toEqual(voidJSON);
  });

  test('convertContractParameter - Map', () => {
    const integerJSON = factory.createIntegerContractParameterJSON();
    const booleanJSON = factory.createBooleanContractParameterJSON();
    const mapJSON = factory.createMapContractParameterJSON({
      value: [[integerJSON, booleanJSON]],
    });

    expect(convertContractParameter(mapJSON)).toEqual({
      type: 'Map',
      value: [[convertContractParameter(integerJSON), convertContractParameter(booleanJSON)]],
    });
  });

  test('convertContractParameter - Hash160', () => {
    const hash160JSON = factory.createHash160ContractParameterJSON({
      value: keys[0].scriptHashString,
    });

    expect(convertContractParameter(hash160JSON)).toEqual({
      type: 'Address',
      value: keys[0].address,
    });
  });

  test('convertContractParameter - Byte Array', () => {
    const byteArrayJSON = factory.createByteArrayContractParameterJSON();

    expect(convertContractParameter(byteArrayJSON)).toEqual({
      type: 'Buffer',
      value: byteArrayJSON.value,
    });
  });
});
