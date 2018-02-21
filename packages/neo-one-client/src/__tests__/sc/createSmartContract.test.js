/* @flow */
import createSmartContract from '../../sc/createSmartContract';
import { NoAccountError, NoContractDeployedError } from '../../errors';
import * as common from '../../sc/common';

import * as abis from '../../__data__/abis';
import contracts from '../../__data__/contracts';

describe('createSmartContract', () => {
  const client = ({}: $FlowFixMe);
  const networks = {
    test: { hash: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce' },
  };

  const verifyMock = (name: string, mock: any) => {
    Object.entries(mock).forEach(([key, maybeMock]) => {
      if (
        maybeMock != null &&
        maybeMock.mock != null &&
        maybeMock.mock.calls != null
      ) {
        expect(maybeMock.mock.calls).toMatchSnapshot(`${name}.${key}`);
      }
    });
  };
  const verifyMocks = () => {
    verifyMock('client', client);
    verifyMock('common', common);
  };

  test('NoAccountError', async () => {
    const func = abis.abiFunction(true);
    const abi = abis.abi([func]);
    const definition = { networks, abi };
    // $FlowFixMe
    client.getCurrentAccount = jest.fn(() => null);

    const smartContract = createSmartContract({ definition, client });

    const result = smartContract[func.name]();
    await expect(result).rejects.toEqual(new NoAccountError());
    verifyMocks();
  });

  test('NoContractDeployedError', async () => {
    const func = abis.abiFunction(true);
    const abi = abis.abi([func]);
    const definition = { networks, abi };
    const from = { id: { network: 'error' } };
    // $FlowFixMe
    client.getCurrentAccount = jest.fn(() => from);

    const smartContract = createSmartContract({ definition, client });

    const result = smartContract[func.name]();
    await expect(result).rejects.toEqual(new NoContractDeployedError('error'));
    verifyMocks();
  });

  test('createCall', async () => {
    const expected = '10';
    const func = abis.abiFunction(true);
    const abi = abis.abi([func]);
    const definition = { networks, abi };
    const options = { from: { network: 'test' } };
    const params = { converted: ['test'], zipped: ['name', 'test'] };
    // $FlowFixMe
    common.convertParams = jest.fn(() => params);
    // $FlowFixMe
    client._call = jest.fn(() => Promise.resolve());
    // $FlowFixMe
    common.convertCallResult = jest.fn(() => expected);

    const smartContract = createSmartContract({ definition, client });

    const result = smartContract[func.name](options);
    await expect(result).resolves.toEqual(expected);
    verifyMocks();
  });

  test('createCall - null params', async () => {
    const expected = '10';
    const func = {
      name: 'funcName',
      constant: true,
      returnType: abis.returns.Void,
    };
    const abi = { functions: [func] };
    const definition = { networks, abi };
    const options = { from: { network: 'test' } };
    const params = { converted: ['test'], zipped: ['name', 'test'] };
    // $FlowFixMe
    common.convertParams = jest.fn(() => params);
    // $FlowFixMe
    client._call = jest.fn(() => Promise.resolve());
    // $FlowFixMe
    common.convertCallResult = jest.fn(() => expected);

    const smartContract = createSmartContract({ definition, client });

    const result = smartContract[func.name](options);
    await expect(result).resolves.toEqual(expected);
    verifyMocks();
  });

  test('createInvoke', async () => {
    const func = abis.abiFunction();
    const event = abis.abiEvent();
    const abi = abis.abi([func], [event]);
    const definition = { networks, abi };
    const options = { from: { network: 'test' } };
    const params = { converted: ['test'], zipped: ['name', 'test'] };

    const action1 = {
      type: 'Event',
      args: [contracts.String, contracts.Integer],
      blockIndex: 1,
      blockHash:
        '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
      transactionIndex: 2,
    };
    const action2 = { type: 'Log' };
    const invokeResult = {
      transaction: 't1',
      confirmed: () =>
        Promise.resolve({
          actions: [action1, action2],
          blockIndex: action1.blockIndex,
          blockHash: action1.blockHash,
          transactionIndex: action1.transactionIndex,
        }),
    };

    const expected = {
      blockIndex: action1.blockIndex,
      blockHash: action1.blockHash,
      transactionIndex: action1.transactionIndex,
      result: 'success',
      events: [action1],
      logs: [action2],
    };

    // $FlowFixMe
    common.convertInvocationResult = jest.fn(() => 'success');
    // $FlowFixMe
    common.convertParams = jest.fn(() => params);
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(action1)
      .mockReturnValueOnce(action2);
    // $FlowFixMe
    client._invoke = jest.fn(() => Promise.resolve(invokeResult));

    const smartContract = createSmartContract({ definition, client });

    const invoke = await smartContract[func.name](options);
    expect(invoke.transaction).toEqual(invokeResult.transaction);

    const result = await invoke.confirmed();
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('createInvoke null events & params', async () => {
    const func = {
      name: 'funcName',
      constant: false,
      returnType: abis.returns.Void,
    };
    const abi = { functions: [func] };
    const definition = { networks, abi };
    const options = { from: { network: 'test' } };
    const params = { converted: ['test'], zipped: ['name', 'test'] };

    const action1 = {
      type: 'Event',
      args: [contracts.String, contracts.Integer],
      blockIndex: 1,
      blockHash:
        '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
      transactionIndex: 2,
    };
    const action2 = { type: 'Log' };
    const invokeResult = {
      transaction: 't1',
      confirmed: () =>
        Promise.resolve({
          actions: [action1, action2],
          blockIndex: action1.blockIndex,
          blockHash: action1.blockHash,
          transactionIndex: action1.transactionIndex,
        }),
    };

    const expected = {
      blockIndex: action1.blockIndex,
      blockHash: action1.blockHash,
      transactionIndex: action1.transactionIndex,
      result: 'success',
      events: [action1],
      logs: [action2],
    };

    // $FlowFixMe
    common.convertInvocationResult = jest.fn(() => 'success');
    // $FlowFixMe
    common.convertParams = jest.fn(() => params);
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(action1)
      .mockReturnValueOnce(action2);
    // $FlowFixMe
    client._invoke = jest.fn(() => Promise.resolve(invokeResult));

    const smartContract = createSmartContract({ definition, client });

    const invoke = await smartContract[func.name](options);
    expect(invoke.transaction).toEqual(invokeResult.transaction);

    const result = await invoke.confirmed();
    expect(result).toEqual(expected);
    verifyMocks();
  });
});
