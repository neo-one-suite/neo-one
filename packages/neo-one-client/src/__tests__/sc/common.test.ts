import { data, factory, keys } from '../../__data__';
import * as common from '../../sc/common';
import { ABIParameter, ContractParameter } from '../../types';

describe('common', () => {
  const name = 'firstArg';
  const parameter: ABIParameter = { type: 'String', name };
  const value = 'test';
  const param: ContractParameter = {
    type: 'String',
    value,
  };

  test('convertParameter', () => {
    const result = common.convertParameter({
      type: parameter,
      parameter: param,
    });

    expect(result).toEqual(value);
  });

  test('getParametersObject', () => {
    const result = common.getParametersObject({
      abiParameters: [parameter],
      parameters: [param],
    });

    expect(result[name]).toEqual(value);
  });

  test('getParametersObject - throws error on mismatched length', () => {
    function testError() {
      common.getParametersObject({
        abiParameters: [parameter, parameter],
        parameters: [param],
      });
    }

    expect(testError).toThrowErrorMatchingSnapshot();
  });

  test('convertAction - log', () => {
    const action = factory.createRawLog();

    const result = common.convertAction({
      action,
      events: {},
    });

    expect(result).toEqual(action);
  });

  test('convertAction - event', () => {
    const event = factory.createABIEvent();
    const action = factory.createRawNotification({
      args: [
        factory.createStringContractParameter({ value: event.name }),
        factory.createAddressContractParameter({ value: keys[0].address }),
        factory.createAddressContractParameter({ value: keys[1].address }),
        factory.createIntegerContractParameter({ value: data.bns.a }),
      ],
    });

    const result = common.convertAction({
      action,
      events: { [event.name]: event },
    });

    if (result.type !== 'Event') {
      throw new Error('For TS');
    }
    expect(result.parameters.from).toEqual(keys[0].address);
    expect(result.parameters.to).toEqual(keys[1].address);
    expect(result.parameters.amount).toBeDefined();
    // tslint:disable-next-line no-non-null-assertion
    expect(result.parameters.amount!.toString()).toEqual('1');
  });

  test('convertAction - missing args event', () => {
    const event = factory.createABIEvent();
    const action = factory.createRawNotification({
      args: [],
    });

    const result = () =>
      common.convertAction({
        action,
        events: { [event.name]: event },
      });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('convertAction - unknown event', () => {
    const event = factory.createABIEvent();
    const action = factory.createRawNotification({
      args: [factory.createStringContractParameter({ value: `something-${event.name}` })],
    });

    const result = () =>
      common.convertAction({
        action,
        events: { [event.name]: event },
      });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('convertInvocationResult - error', async () => {
    const rawInvocationResult = factory.createRawInvocationResultError();

    const result = await common.convertInvocationResult({
      returnType: factory.createStringABIReturn(),
      result: rawInvocationResult,
      actions: [factory.createRawNotification()],
    });

    expect(result.state).toEqual('FAULT');
    expect(result.gasConsumed).toEqual(rawInvocationResult.gasConsumed);
    expect(result.gasCost).toEqual(rawInvocationResult.gasCost);
    if (result.state !== 'FAULT') {
      throw new Error('For TS');
    }
    expect(result.message).toEqual(rawInvocationResult.message);
  });

  test('convertInvocationResult - value', async () => {
    const rawInvocationResult = factory.createRawInvocationResultSuccess();

    const result = await common.convertInvocationResult({
      returnType: factory.createIntegerABIReturn(),
      result: rawInvocationResult,
      actions: [factory.createRawNotification()],
    });

    expect(result.state).toEqual('HALT');
    expect(result.gasConsumed).toEqual(rawInvocationResult.gasConsumed);
    expect(result.gasCost).toEqual(rawInvocationResult.gasCost);
    if (result.state !== 'HALT') {
      throw new Error('For TS');
    }

    const stackItem = rawInvocationResult.stack[0];
    if (stackItem.type !== 'Integer' || result.value === undefined) {
      throw new Error('For TS');
    }
    expect(result.value.toString()).toEqual(stackItem.value.toString(10));
  });

  test('convertCallResult - error', async () => {
    const rawInvocationResult = factory.createRawInvocationResultError();

    const result = common.convertCallResult({
      returnType: factory.createStringABIReturn(),
      result: rawInvocationResult,
      actions: [factory.createRawNotification()],
    });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('convertCallResult - value', async () => {
    const rawInvocationResult = factory.createRawInvocationResultSuccess();

    const result = await common.convertCallResult({
      returnType: factory.createIntegerABIReturn(),
      result: rawInvocationResult,
      actions: [factory.createRawNotification()],
    });

    const stackItem = rawInvocationResult.stack[0];
    if (stackItem.type !== 'Integer' || result === undefined) {
      throw new Error('For TS');
    }
    expect(result.toString()).toEqual(stackItem.value.toString(10));
  });

  test('convertParams - simple', () => {
    const { converted, zipped } = common.convertParams({
      parameters: [parameter],
      params: [param.value],
    });

    expect(converted).toHaveLength(1);
    expect(converted[0]).toEqual(param.value);
    expect(zipped).toHaveLength(1);
    expect(zipped[0]).toEqual([parameter.name, param.value]);
  });

  test('convertParams - optional param', () => {
    const optionalParam = factory.createStringABIParameter({ optional: true });
    const { converted, zipped } = common.convertParams({
      parameters: [parameter, optionalParam],
      params: [param.value],
    });

    expect(converted).toHaveLength(2);
    expect(converted[0]).toEqual(param.value);
    expect(converted[1]).toEqual(undefined);
    expect(zipped).toHaveLength(2);
    expect(zipped[0]).toEqual([parameter.name, param.value]);
    expect(zipped[1]).toEqual([optionalParam.name, undefined]);
  });

  test('convertParams - missing param', () => {
    const optionalParam = factory.createStringABIParameter();
    const result = () =>
      common.convertParams({
        parameters: [parameter, optionalParam],
        params: [param.value],
      });

    expect(result).toThrowErrorMatchingSnapshot();
  });
});
