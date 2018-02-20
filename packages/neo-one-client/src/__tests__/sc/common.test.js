/* @flow */
import BigNumber from 'bignumber.js';

import * as common from '../../sc/common';
import {
  InvalidEventError,
  InvalidArgumentError,
  InvocationCallError,
} from '../../errors';
import * as abis from '../../__data__/abis';

describe('common', () => {
  const abiParameter = { name: 'name', type: 'String' };
  const contractParameter = { type: 'String', value: 'test' };

  test('convertParameter', () => {
    const expected = contractParameter.value;

    const result = common.convertParameter({
      type: abiParameter,
      parameter: contractParameter,
    });
    expect(result).toEqual(expected);
  });

  test('getParametersObject', () => {
    const abiParameters = [abiParameter];
    const contractParameters = [contractParameter];
    const expected = { name: 'test' };

    const result = common.getParametersObject({
      abiParameters,
      parameters: contractParameters,
    });
    expect(result).toEqual(expected);
  });

  test('getParametersObject throws error on mismatched length', () => {
    const abiParameters = [abiParameter, abiParameter];
    const contractParameters = [contractParameter];

    function testError() {
      common.getParametersObject({
        abiParameters,
        parameters: contractParameters,
      });
    }

    expect(testError).toThrow(
      new InvalidArgumentError(
        `Expected ABI parameters length (${abiParameters.length}) to equal ` +
          `parameters length (${contractParameters.length})`,
      ),
    );
  });

  test('convertAction returns Log action types immediately', () => {
    const action = {
      version: 0,
      blockIndex: 1,
      blockHash: 'blockHash1',
      transactionIndex: 2,
      transactionHash: 'transHash1',
      index: 3,
      scriptHash: 'scriptHash1',
      type: 'Log',
      message: 'msg',
    };
    const result = common.convertAction({
      action,
      events: { event1: abis.abiEvent() },
    });
    expect(result).toEqual(action);
  });

  test('convertAction throws error on missing args', () => {
    const action = {
      version: 0,
      blockIndex: 1,
      blockHash: 'blockHash1',
      transactionIndex: 2,
      transactionHash: 'transHash1',
      index: 3,
      scriptHash: 'scriptHash1',
      type: 'Notification',
      args: [],
    };
    function testError() {
      common.convertAction({ action, events: { event1: abis.abiEvent() } });
    }

    expect(testError).toThrow(
      new InvalidEventError('Notification had no arguments'),
    );
  });

  test('convertAction throws error on missing event property', () => {
    const action = {
      version: 0,
      blockIndex: 1,
      blockHash: 'blockHash1',
      transactionIndex: 2,
      transactionHash: 'transHash1',
      index: 3,
      scriptHash: 'scriptHash1',
      type: 'Notification',
      args: [contractParameter],
    };
    const events = {};
    function testError() {
      common.convertAction({ action, events });
    }

    expect(testError).toThrow(
      new InvalidEventError(`Unknown event ${String(action.args[0].value)}`),
    );
  });

  test('convertAction on notification action', () => {
    const action = {
      type: 'Notification',
      args: [contractParameter, contractParameter],
      version: 0,
      blockIndex: 1,
      blockHash:
        '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
      transactionIndex: 2,
      transactionHash:
        '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89cb',
      index: 3,
      scriptHash: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce',
    };
    const events = {
      test: { name: 'test', parameters: [abiParameter] },
    };
    const expected = {
      version: action.version,
      blockIndex: action.blockIndex,
      blockHash: action.blockHash,
      transactionIndex: action.transactionIndex,
      transactionHash: action.transactionHash,
      index: action.index,
      scriptHash: action.scriptHash,
      type: 'Event',
      name: action.args[0].value,
      parameters: { name: 'test' },
    };

    const result = common.convertAction({ action, events });
    expect(result).toEqual(expected);
  });

  test('convertInvocationResult - invocation error', () => {
    const returnType = { type: 'Void' };
    const invokeResult = {
      state: 'FAULT',
      gasConsumed: new BigNumber('10'),
      stack: [],
      message: 'message',
    };
    const expected = {
      state: 'FAULT',
      gasConsumed: new BigNumber('10'),
      message: 'message',
    };

    const result = common.convertInvocationResult({
      returnType,
      result: invokeResult,
    });
    expect(result).toEqual(expected);
  });

  test('convertInvocationResult - invocation succeess', () => {
    const returnType = { type: 'String' };
    const invokeResult = {
      state: 'HALT',
      gasConsumed: new BigNumber('10'),
      stack: [contractParameter],
    };
    const expected = {
      state: invokeResult.state,
      gasConsumed: invokeResult.gasConsumed,
      value: 'test',
    };

    const result = common.convertInvocationResult({
      returnType,
      result: invokeResult,
    });
    expect(result).toEqual(expected);
  });

  test('convertInvocationResult - invocation success with null stack', () => {
    const returnType = { type: 'String' };
    const invokeResult = {
      state: 'HALT',
      gasConsumed: new BigNumber('10'),
      stack: [],
    };
    const expected = {
      state: invokeResult.state,
      gasConsumed: invokeResult.gasConsumed,
    };

    const result = common.convertInvocationResult({
      returnType,
      result: invokeResult,
    });
    expect(result).toEqual(expected);
  });

  test('convertCallResult throws error on fault', () => {
    const returnType = { type: 'String' };
    const resultCall = {
      state: 'FAULT',
      gasConsumed: new BigNumber('10'),
      stack: [contractParameter],
      message: 'testMsg',
    };

    function testError() {
      return common.convertCallResult({
        returnType,
        result: resultCall,
      });
    }

    expect(testError).toThrow(new InvocationCallError(resultCall.message));
  });

  test('convertCallResult', () => {
    const returnType = { type: 'String' };
    const resultCall = {
      state: 'HALT',
      gasConsumed: new BigNumber('10'),
      stack: [contractParameter],
    };
    const expected = 'test';

    const result = common.convertCallResult({
      returnType,
      result: resultCall,
    });
    expect(result).toEqual(expected);
  });

  test('convertCallResult on null stack', () => {
    const returnType = { type: 'String' };
    const resultCall = {
      state: 'HALT',
      gasConsumed: new BigNumber('10'),
      stack: [],
    };

    const result = common.convertCallResult({
      returnType,
      result: resultCall,
    });
    expect(result).toBeUndefined();
  });

  test('convertParams', () => {
    const parameters = [abiParameter];
    const params = ['test'];
    const expected = {
      converted: params,
      zipped: [['name', 'test']],
    };
    const result = common.convertParams({ parameters, params });
    expect(result).toEqual(expected);
  });

  test('convertParams throws error on mismatched length', () => {
    const parameters = [abiParameter];
    const params = ['test1', 'test2'];
    function testError() {
      common.convertParams({ parameters, params });
    }

    expect(testError).toThrow(
      new InvalidArgumentError(
        `Expected parameters length (${parameters.length}) to equal params ` +
          `length (${params.length}).`,
      ),
    );
  });
});
