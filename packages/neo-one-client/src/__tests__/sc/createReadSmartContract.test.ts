import { toArray } from 'ix/asynciterable/toarray';
import { createReadSmartContract } from '../../sc/createReadSmartContract';
import * as common from '../../sc/common';
import * as abis from '../../__data__/abis';

describe('createReadSmartContract', () => {
  const expectedLog = {
    version: 0,
    blockIndex: 1,
    blockHash: 'blockLogHash',
    transactionIndex: 2,
    transactionHash: 'transLogHash',
    index: 3,
    type: 'Log',
    message: 'logMsg',
    scriptHash: 'hash',
  };

  const expectedEvent = {
    version: 4,
    blockIndex: 5,
    blockHash: 'blockEventHash',
    transactionIndex: 6,
    transactionHash: 'transEventHash',
    index: 7,
    type: 'Event',
    message: 'eventMsg',
    scriptHash: 'hash',
    parameters: {},
    name: 'eventName',
  };

  const expected = [expectedLog, expectedEvent];
  const hash = 'hash';
  const abi = abis.abi([abis.abiFunction(true)], [abis.abiEvent()]);
  const abiNull = {
    functions: [
      {
        name: 'funcName',
        constant: true,
        returnType: abis.returns.Void,
      },

      {
        name: 'nullName',
        constant: false,
        returnType: abis.returns.Void,
      },
    ],
  };

  let client = {} as any;

  const verifyMock = (name: string, mock: any) => {
    Object.entries(mock).forEach(([key, maybeMock]) => {
      // @ts-ignore
      if (
        maybeMock != null &&
        (maybeMock as any).mock != null &&
        (maybeMock as any).mock.calls != null
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

  let nullEventsContract = createReadSmartContract({
    hash,
    abi: abiNull,
    client,
  });

  let readContract = createReadSmartContract({ hash, abi, client });

  beforeEach(() => {
    client = {} as any;
    // @ts-ignore
    client.call = jest.fn(() => Promise.resolve());
    // @ts-ignore
    (common as any).convertParams = jest.fn(() => expected);
    // @ts-ignore
    (common as any).convertInvocationResult = jest.fn(() => expected);
    // @ts-ignore
    client.iterActionsRaw = jest.fn(() => expected);

    nullEventsContract = createReadSmartContract({
      hash,
      abi: abiNull,
      client,
    });

    readContract = createReadSmartContract({ hash, abi, client });
  });

  test('smartContract creation - createCall', async () => {
    // @ts-ignore
    (common as any).convertCallResult = jest.fn(() => expected);

    const result = await readContract[abi.functions[0].name]();
    expect(result).toEqual(expected);

    const nullEventsResult = await nullEventsContract[abi.functions[0].name]();
    expect(nullEventsResult).toEqual(expected);
    expect(nullEventsContract.nulName).toBeUndefined();
    verifyMocks();
  });

  test('iterActions with filter', async () => {
    const filter = {
      indexStart: 0,
      indexStop: 1,
    };

    // @ts-ignore
    (common as any).convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterActions(filter));
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('iterActions with no filter', async () => {
    // @ts-ignore
    client.iterActionsRaw = jest.fn(() => expected);
    // @ts-ignore
    (common as any).convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterActions());
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('iterEvents', async () => {
    // @ts-ignore
    (common as any).convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterEvents());
    expect(result).toEqual([expectedEvent]);
    verifyMocks();
  });

  test('iterLogs', async () => {
    // @ts-ignore
    (common as any).convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterLogs());
    expect(result).toEqual([expectedLog]);
    verifyMocks();
  });

  test('iterStorage', async () => {
    // @ts-ignore
    client.iterStorage = jest.fn(() => expected);

    const result = nullEventsContract.iterStorage();
    expect(result).toEqual(expected);
    verifyMocks();
  });
});
