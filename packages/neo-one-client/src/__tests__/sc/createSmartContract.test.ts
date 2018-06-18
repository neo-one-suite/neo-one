import * as abis from '../../__data__/abis';
import { contracts } from '../../__data__/contracts';
import { NoAccountError, NoContractDeployedError } from '../../errors';
import * as common from '../../sc/common';
import { createSmartContract } from '../../sc/createSmartContract';

describe('createSmartContract', () => {
  const client = {} as any;
  const networks = {
    test: { hash: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce' },
  };

  const verifyMock = (name: string, mock: any) => {
    Object.entries(mock).forEach(([key, maybeMock]) => {
      // @ts-ignore
      if (
        maybeMock != undefined &&
        (maybeMock as any).mock != undefined &&
        (maybeMock as any).mock.calls != undefined
      ) {
        // @ts-ignore
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
    // @ts-ignore
    client.getCurrentAccount = jest.fn(() => undefined);

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
    // @ts-ignore
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
    // @ts-ignore
    common.convertParams = jest.fn(() => params);
    // @ts-ignore
    client.call = jest.fn(() => Promise.resolve());
    // @ts-ignore
    common.convertCallResult = jest.fn(() => expected);

    const smartContract = createSmartContract({ definition, client });

    const result = smartContract[func.name](options);
    await expect(result).resolves.toEqual(expected);
    verifyMocks();
  });

  test('createCall - undefined params', async () => {
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
    // @ts-ignore
    common.convertParams = jest.fn(() => params);
    // @ts-ignore
    client.call = jest.fn(() => Promise.resolve());
    // @ts-ignore
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
      blockHash: '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
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

    // @ts-ignore
    common.convertInvocationResult = jest.fn(() => 'success');
    // @ts-ignore
    common.convertParams = jest.fn(() => params);
    // @ts-ignore
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(action1)
      .mockReturnValueOnce(action2);
    // @ts-ignore
    client.invoke = jest.fn(() => Promise.resolve(invokeResult));

    const smartContract = createSmartContract({ definition, client });

    const invoke = await smartContract[func.name](options);
    expect(invoke.transaction).toEqual(invokeResult.transaction);

    const result = await invoke.confirmed();
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('createInvoke undefined events & params', async () => {
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
      blockHash: '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
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

    // @ts-ignore
    common.convertInvocationResult = jest.fn(() => 'success');
    // @ts-ignore
    common.convertParams = jest.fn(() => params);
    // @ts-ignore
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(action1)
      .mockReturnValueOnce(action2);
    // @ts-ignore
    client.invoke = jest.fn(() => Promise.resolve(invokeResult));

    const smartContract = createSmartContract({ definition, client });

    const invoke = await smartContract[func.name](options);
    expect(invoke.transaction).toEqual(invokeResult.transaction);

    const result = await invoke.confirmed();
    expect(result).toEqual(expected);
    verifyMocks();
  });
});
