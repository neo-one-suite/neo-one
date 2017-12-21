/* @flow */
/* eslint-disable no-loop-func */
// flowlint untyped-import:off
// flowlint unclear-type:off
import { VM_STATE, utils } from '@neo-one/core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';

import { toArray } from 'ix/asynciterable/toarray';

import BasicClient from '../BasicClient';
import Client from '../Client';

import { keys } from '../__data__';

const hash = keys[0].scriptHash;

const decimals = 4;

const stringReturn = {
  type: 'String',
  value: 'foobar',
};
const integerReturn = {
  type: 'Integer',
  value: `${decimals}`,
};
const integerExpected = (result: $FlowFixMe) =>
  expect(result.toString(10)).toEqual(
    new BigNumber(integerReturn.value).div(10 ** decimals).toString(10),
  );
const booleanReturn = {
  type: 'Boolean',
  value: true,
};
const methods = [
  {
    method: 'name',
    constant: true,
    params: undefined,
    ret: stringReturn,
    expected: stringReturn.value,
  },
  {
    method: 'symbol',
    constant: true,
    params: undefined,
    ret: stringReturn,
    expected: stringReturn.value,
  },
  {
    method: 'totalSupply',
    constant: true,
    params: undefined,
    ret: integerReturn,
    expected: integerExpected,
  },
  {
    method: 'decimals',
    constant: true,
    params: undefined,
    ret: integerReturn,
    expected: new BigNumber(integerReturn.value),
  },
  {
    method: 'transfer',
    constant: false,
    params: [keys[0].scriptHash, keys[1].address, '10'],
    ret: booleanReturn,
    expected: true,
  },
  {
    method: 'balanceOf',
    constant: false,
    params: [keys[0].scriptHash],
    ret: integerReturn,
    expected: integerExpected,
  },
];

const mockWithFault = ({
  client,
  ret,
  fault,
}: {|
  client: any,
  ret: any,
  fault: boolean,
|}) => {
  const originalInvokeMethodScript = client._getInvokeMethodScript.bind(client);
  // eslint-disable-next-line
  client._getInvokeMethodScript = jest.fn((...args) =>
    originalInvokeMethodScript(...args),
  );
  const result = Promise.resolve({
    state: fault ? VM_STATE.FAULT : VM_STATE.HALT,
    gas_consumed: '0',
    stack: [ret],
  });
  // eslint-disable-next-line
  client.testInvokeRaw = jest.fn(() => result);
  // eslint-disable-next-line
  client._testInvocation = jest.fn(() => result);
  // eslint-disable-next-line
  client._sendTransactionRaw = jest.fn(() => Promise.resolve());
  if (client.invoke != null) {
    // eslint-disable-next-line
    const invokeMock = jest.spyOn(client, 'invoke');
    return { invokeMock };
  }

  return {};
};

const invoke = async ({
  smartContract,
  method,
  params,
  constant,
}: {|
  smartContract: any,
  method: string,
  params: any,
  constant: boolean,
|}) => {
  let result;
  if (constant) {
    if (params.length === 0) {
      result = await smartContract.constant$[method]();
    } else {
      result = await smartContract.constant$[method]({ params });
    }
  } else if (params.length === 0) {
    const res = await smartContract[method]({
      privateKey: keys[0].privateKey,
    });
    // eslint-disable-next-line
    result = res.result;
  } else {
    const res = await smartContract[method]({
      params,
      privateKey: keys[0].privateKey,
    });
    // eslint-disable-next-line
    result = res.result;
  }

  return result;
};

const testABI = {
  hash,
  functions: [
    {
      name: 'test',
      constant: true,
      returnType: 'Array',
    },
  ],
};

const getNEP5ABI = async (client: Client | BasicClient) => {
  const mock = jest.spyOn(client, 'testInvokeRaw').mockReturnValue(
    Promise.resolve({
      state: VM_STATE.HALT,
      stack: [{ type: 'Integer', value: `${decimals}` }],
    }),
  );

  const abi = await client.abi.NEP5(hash);

  mock.mockRestore();

  return abi;
};

let mock;
beforeEach(() => {
  mock = jest.spyOn(utils, 'randomUInt').mockReturnValue(10);
});

afterEach(() => {
  if (mock != null) {
    mock.mockRestore();
  }
});

describe('BasicClient.smartContract NEP5', () => {
  const client = new BasicClient();
  let smartContract = client.contract(testABI);
  beforeEach(async () => {
    const abi = await getNEP5ABI(client);
    smartContract = client.contract(abi);
  });

  for (const methodConfig of methods) {
    const { method, constant, ret, params: paramsIn } = methodConfig;
    const params = paramsIn || [];

    test(method, async () => {
      mockWithFault({
        client,
        ret,
        fault: false,
      });

      const result = await invoke({
        smartContract,
        constant,
        method,
        params,
      });

      expect(result).toMatchSnapshot();
      expect(client._getInvokeMethodScript).toHaveBeenCalledTimes(1);
      expect(client._getInvokeMethodScript.mock.calls[0][0]).toMatchSnapshot();
      if (constant) {
        expect(client.testInvokeRaw).toHaveBeenCalledTimes(1);
        expect(client.testInvokeRaw.mock.calls[0][0]).toMatchSnapshot();
      } else {
        expect(client._sendTransactionRaw).toHaveBeenCalledTimes(1);
        expect(client._sendTransactionRaw.mock.calls[0][0]).toMatchSnapshot();
      }
    });
  }
});

describe('Client.smartContract NEP5', () => {
  let client = new Client();
  let smartContract = client.contract(testABI);
  beforeEach(async () => {
    client = new Client();
    const abi = await getNEP5ABI(client);
    smartContract = client.contract(abi);
  });

  for (const methodConfig of methods.filter(({ constant }) => !constant)) {
    const { method, constant, ret, params, expected } = methodConfig;

    test(method, async () => {
      const { invokeMock } = mockWithFault({
        client,
        ret,
        fault: false,
      });

      const result = await invoke({
        smartContract,
        constant,
        method,
        params,
      });

      if (typeof expected === 'function') {
        expected(result);
      } else {
        expect(result).toEqual(expected);
      }
      expect(client._getInvokeMethodScript).toHaveBeenCalledTimes(1);
      expect(client._getInvokeMethodScript.mock.calls[0][0]).toMatchSnapshot();
      if (!constant) {
        expect(invokeMock).toHaveBeenCalledTimes(1);
        expect(invokeMock.mock.calls[0][0]).toMatchSnapshot();
      }
    });

    test(`${method} error`, async () => {
      mockWithFault({
        client,
        ret,
        fault: true,
      });

      try {
        await invoke({
          smartContract,
          constant,
          method,
          params,
        });
        expect(false).toBeTruthy();
      } catch (error) {
        expect(error.code).toEqual('INVOKE');
      }
    });
  }
});

const transferContractParameter = {
  type: 'String',
  value: 'transfer',
};
const from0ContractParameter = {
  type: 'Hash160',
  value: keys[0].scriptHash,
};
const from1ContractParameter = {
  type: 'Hash160',
  value: keys[1].scriptHash,
};
const toContractParameter = {
  type: 'Hash160',
  value: keys[2].scriptHash,
};
const amountContractParameter = {
  type: 'Integer',
  value: '1000000000',
};

describe('Client.iter NEP5', () => {
  const client = new Client();
  let smartContract = client.contract(testABI);
  beforeEach(async () => {
    const abi = await getNEP5ABI(client);
    smartContract = client.contract(abi);
  });

  const actions = [
    {
      type: 'Notification',
      args: [
        transferContractParameter,
        from1ContractParameter,
        toContractParameter,
        amountContractParameter,
      ],
    },
    {
      type: 'Log',
      message: 'bar',
    },
    {
      type: 'Notification',
      args: [
        transferContractParameter,
        from0ContractParameter,
        toContractParameter,
        amountContractParameter,
      ],
    },
    {
      type: 'Log',
      message: 'foo',
    },
  ];
  const events = [
    {
      name: 'transfer',
      parameters: {
        from: keys[1].scriptHash,
        to: keys[2].scriptHash,
        amount: new BigNumber(amountContractParameter.value).div(
          10 ** decimals,
        ),
      },
    },
    {
      name: 'transfer',
      parameters: {
        from: keys[0].scriptHash,
        to: keys[2].scriptHash,
        amount: new BigNumber(amountContractParameter.value).div(
          10 ** decimals,
        ),
      },
    },
  ];
  const logs = ['bar', 'foo'];
  beforeEach(() => {
    // $FlowFixMe
    client.iterActions = jest.fn(() => AsyncIterableX.from(actions));
  });

  test('iterActions', async () => {
    const result = await toArray(smartContract.iterActions());

    expect(result).toEqual(actions);
  });

  test('iterEvents', async () => {
    const result = await toArray(smartContract.iterEvents());

    expect(result).toEqual(events);
  });

  test('iterLogs', async () => {
    const result = await toArray(smartContract.iterLogs());

    expect(result).toEqual(logs);
  });

  test('iterStorage', async () => {
    const storageItems = [{ key: 'foo' }, { key: 'bar' }];
    // $FlowFixMe
    client.iterStorage = jest.fn(() => AsyncIterableX.from(storageItems));

    const result = await toArray(smartContract.iterStorage());

    expect(result).toEqual(storageItems);
    expect(client.iterStorage).toHaveBeenCalledWith(keys[0].scriptHashUInt160);
  });
});

describe('BaseClient error cases', () => {
  const client = new Client();
  let smartContract = client.contract(testABI);
  beforeEach(async () => {
    const abi = await getNEP5ABI(client);
    smartContract = client.contract(abi);
  });

  test('failed constant invoke', async () => {
    // $FlowFixMe
    client.testInvokeMethodRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.FAULT,
      }),
    );

    try {
      await smartContract.constant$.decimals();
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVOKE');
      expect(error.message).toMatchSnapshot();
    }
  });
});

describe('Client error cases', () => {
  const client = new Client();
  let smartContract = client.contract(testABI);
  beforeEach(async () => {
    const abi = await getNEP5ABI(client);
    smartContract = client.contract(abi);
  });

  test('iterEvents notification missing', async () => {
    // $FlowFixMe
    client.iterActions = jest.fn(() =>
      AsyncIterableX.from([
        {
          type: 'Notification',
          args: [],
        },
      ]),
    );
    try {
      await toArray(smartContract.iterEvents());
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('NOTIFICATION_MISSING_EVENT');
    }
  });

  test('iterEvents notification not enough args', async () => {
    // $FlowFixMe
    client.iterActions = jest.fn(() =>
      AsyncIterableX.from([
        {
          type: 'Notification',
          args: [
            transferContractParameter,
            from0ContractParameter,
            toContractParameter,
          ],
        },
      ]),
    );
    try {
      await toArray(smartContract.iterEvents());
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('missing params', async () => {
    try {
      await smartContract.transfer({
        privateKey: keys[0].privateKey,
        params: [keys[0].scriptHash, keys[1].address],
      });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('failed constant invoke', async () => {
    const expectedMessage = 'foobar';
    // $FlowFixMe
    client.testInvokeMethodRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.FAULT,
        message: expectedMessage,
      }),
    );

    try {
      await smartContract.constant$.decimals();
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVOKE');
      expect(error.message).toEqual(expectedMessage);
    }
  });
});

describe('Client array', () => {
  let client = new Client();
  beforeEach(() => {
    client = new Client();
  });

  test('Client Array param', async () => {
    const smartContract = client.contract({
      hash,
      functions: [
        {
          name: 'test',
          constant: true,
          parameters: [{ name: 'test', type: 'Array' }],
          returnType: 'Boolean',
        },
      ],
    });
    // $FlowFixMe
    client.testInvokeMethodRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        stack: [{ type: 'Boolean', value: true }],
      }),
    );

    await smartContract.constant$.test({
      params: [['foo', 'bar']],
    });

    expect(client.testInvokeMethodRaw).toHaveBeenCalledTimes(1);
    expect(client.testInvokeMethodRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('Client Array return', async () => {
    const smartContract = client.contract(testABI);
    // $FlowFixMe
    client.testInvokeMethodRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        stack: [{ type: 'Array', value: [{ type: 'String', value: 'foo' }] }],
      }),
    );

    const result = await smartContract.constant$.test();

    expect(result).toEqual(['foo']);
  });
});

test('Client integer param no decimals', async () => {
  const client = new Client();
  const smartContract = client.contract({
    hash,
    functions: [
      {
        name: 'test',
        constant: true,
        parameters: [{ name: 'test', type: 'Integer' }],
        returnType: 'Boolean',
      },
    ],
  });
  // $FlowFixMe
  client.testInvokeMethodRaw = jest.fn(() =>
    Promise.resolve({
      state: VM_STATE.HALT,
      stack: [{ type: 'Boolean', value: true }],
    }),
  );

  await smartContract.constant$.test({
    params: ['10'],
  });

  expect(client.testInvokeMethodRaw).toHaveBeenCalledTimes(1);
  expect(client.testInvokeMethodRaw.mock.calls[0][0]).toMatchSnapshot();
});

const simpleABI = {
  hash,
  functions: [
    {
      name: 'test',
      returnType: 'Boolean',
    },
  ],
};

test('BasicClient no params no parameters', async () => {
  const client = new BasicClient();
  const smartContract = client.contract(simpleABI);
  const expectedTXID = '0x00';
  // $FlowFixMe
  client.invokeMethodRaw = jest.fn(() => Promise.resolve(expectedTXID));

  const txid = await smartContract.test({
    privateKey: keys[0].privateKey,
  });

  expect(txid).toEqual(expectedTXID);
  expect(client.invokeMethodRaw).toHaveBeenCalledTimes(1);
  expect(client.invokeMethodRaw.mock.calls[0][0]).toMatchSnapshot();
});

test('Client no params no parameters', async () => {
  const client = new Client();
  const smartContract = client.contract(simpleABI);
  const expectedTXID = '0x00';
  const expectedResult = true;
  // $FlowFixMe
  client.invokeMethod = jest.fn(() =>
    Promise.resolve({
      txid: expectedTXID,
      stack: [{ type: 'Boolean', value: expectedResult }],
    }),
  );

  const { txid, result } = await smartContract.test({
    privateKey: keys[0].privateKey,
  });

  expect(txid).toEqual(expectedTXID);
  expect(result).toEqual(expectedResult);
  expect(client.invokeMethod).toHaveBeenCalledTimes(1);
  expect(client.invokeMethod.mock.calls[0][0]).toMatchSnapshot();
});
