import { toArray } from 'ix/asynciterable/toarray';
import * as abis from '../../__data__/abis';
import * as common from '../../sc/common';
import { createReadSmartContract } from '../../sc/createReadSmartContract';

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
        name: 'undefinedName',
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

  let undefinedEventsContract = createReadSmartContract({
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

    undefinedEventsContract = createReadSmartContract({
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

    const undefinedEventsResult = await undefinedEventsContract[abi.functions[0].name]();
    expect(undefinedEventsResult).toEqual(expected);
    expect(undefinedEventsContract.nulName).toBeUndefined();
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

    const result = undefinedEventsContract.iterStorage();
    expect(result).toEqual(expected);
    verifyMocks();
  });
});
