/* @flow */
import { toArray } from 'ix/asynciterable/toarray';

import createReadSmartContract from '../../sc/createReadSmartContract';
import * as common from '../../sc/common';
import ReadClient from '../../ReadClient';
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
  const abiNull = abis.abi();

  const client = new ReadClient(({}: $FlowFixMe));
  // $FlowFixMe
  client._call = jest.fn(() => Promise.resolve());
  // $FlowFixMe
  common.convertParams = jest.fn(() => expected);
  // $FlowFixMe
  common.convertInvocationResult = jest.fn(() => expected);

  const nullEventsContract = createReadSmartContract({
    hash,
    abi: abiNull,
    client,
  });
  const readContract = createReadSmartContract({ hash, abi, client });

  test('smartContract creation - createCall', async () => {
    // $FlowFixMe
    common.convertCallResult = jest.fn(() => expected);

    const result = await readContract[abi.functions[0].name]();
    expect(result).toEqual(expected);
    expect(nullEventsContract[abi.functions[0].name]).toBeUndefined();
  });

  test('iterActions with filter', async () => {
    const filter = {
      indexStart: 0,
      indexStop: 1,
    };
    // $FlowFixMe
    client._iterActionsRaw = jest.fn(() => expected);
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterActions(filter));
    expect(result).toEqual(expected);
    expect(client._iterActionsRaw).toBeCalledWith(filter);
  });

  test('iterActions with no filter', async () => {
    // $FlowFixMe
    client._iterActionsRaw = jest.fn(() => expected);
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterActions());
    expect(result).toEqual(expected);
    expect(client._iterActionsRaw).toBeCalledWith({});
  });

  test('iterEvents', async () => {
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterEvents());
    expect(result).toEqual([expectedEvent]);
  });

  test('iterLogs', async () => {
    // $FlowFixMe
    common.convertAction = jest
      .fn()
      .mockReturnValueOnce(expectedLog)
      .mockReturnValueOnce(expectedEvent);

    const result = await toArray(readContract.iterLogs());
    expect(result).toEqual([expectedLog]);
  });

  test('iterStorage', async () => {
    // $FlowFixMe
    client._iterStorage = jest.fn(() => expected);

    const result = nullEventsContract.iterStorage();
    expect(result).toEqual(expected);
  });
});
