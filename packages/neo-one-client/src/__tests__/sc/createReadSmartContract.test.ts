// tslint:disable variable-name no-non-null-assertion
import { AsyncIterableX, toArray } from '@reactivex/ix-es2015-cjs/asynciterable';
import { data, factory, keys } from '../../__data__';
import { ReadClient } from '../../ReadClient';
import { createReadSmartContract } from '../../sc';
import { Action, DataProvider } from '../../types';

describe('createReadSmartContract', () => {
  const getAccount = jest.fn();
  const getAsset = jest.fn();
  const getBlock = jest.fn();
  const getContract = jest.fn();
  const iterBlocks = jest.fn();
  const getBestBlockHash = jest.fn();
  const getBlockCount = jest.fn();
  const getMemPool = jest.fn();
  const getTransaction = jest.fn();
  const getOutput = jest.fn();
  const getConnectedPeers = jest.fn();
  const getStorage = jest.fn();
  const iterStorage = jest.fn();
  const smartContract = jest.fn();
  const __iterActionsRaw = jest.fn();
  const __call = jest.fn();
  // tslint:disable-next-line no-any
  const dataProvider: DataProvider = jest.fn() as any;
  const client: ReadClient = {
    dataProvider,
    getAccount,
    getAsset,
    getBlock,
    getContract,
    iterBlocks,
    getBestBlockHash,
    getBlockCount,
    getMemPool,
    getTransaction,
    getOutput,
    getConnectedPeers,
    getStorage,
    iterStorage,
    smartContract,
    __iterActionsRaw,
    __call,
  };

  const definition = factory.createReadSmartContractDefinition();
  let contract = createReadSmartContract({ definition, client });
  beforeEach(() => {
    contract = createReadSmartContract({ definition, client });
  });

  const rawLog = factory.createRawLog({ address: contract.definition.address });
  const actions = [factory.createRawTransferNotification({ address: contract.definition.address }), rawLog];
  const otherActions = [
    factory.createRawTransferNotification({ address: keys[1].address }),
    factory.createRawLog({ address: keys[1].address }),
  ];
  const allActions = actions.concat(otherActions);

  const verifyEvent = (event: Action) => {
    if (event.type !== 'Event') {
      throw new Error('For TS');
    }
    expect(event.address).toEqual(contract.definition.address);
    expect(event.parameters.from).toEqual(keys[0].address);
    expect(event.parameters.to).toEqual(keys[1].address);
    expect(event.parameters.amount).toBeDefined();
    expect(event.parameters.amount!.toString()).toEqual('10');
  };

  const verifyLog = (log: Action) => {
    if (log.type !== 'Log') {
      throw new Error('For TS');
    }
    expect(log.address).toEqual(contract.definition.address);
    expect(log.message).toEqual(rawLog.message);
  };

  test('iterActions', async () => {
    __iterActionsRaw.mockImplementationOnce(() => AsyncIterableX.from(allActions));

    const result = await toArray(contract.iterActions({ indexStart: 3, indexStop: 5 }));

    expect(result).toHaveLength(2);
    verifyEvent(result[0]);
    verifyLog(result[1]);
    expect(__iterActionsRaw.mock.calls).toMatchSnapshot();
  });

  test('iterEvents', async () => {
    __iterActionsRaw.mockImplementationOnce(() => AsyncIterableX.from(allActions));

    const result = await toArray(contract.iterEvents({ indexStart: 3, indexStop: 5 }));

    expect(result).toHaveLength(1);
    verifyEvent(result[0]);
    expect(__iterActionsRaw.mock.calls).toMatchSnapshot();
  });

  test('iterLogs', async () => {
    __iterActionsRaw.mockImplementationOnce(() => AsyncIterableX.from(allActions));

    const result = await toArray(contract.iterLogs({ indexStart: 3, indexStop: 5 }));

    expect(result).toHaveLength(1);
    verifyLog(result[0]);
    expect(__iterActionsRaw.mock.calls).toMatchSnapshot();
  });

  test('iterStorage', async () => {
    iterStorage.mockImplementationOnce(() => []);

    await toArray(contract.iterStorage());

    expect(iterStorage.mock.calls).toMatchSnapshot();
  });

  test('createCall', async () => {
    const receipt = factory.createRawCallReceipt({
      result: factory.createRawInvocationResultSuccess({
        stack: [factory.createIntegerContractParameter({ value: data.bns.a })],
      }),
    });
    __call.mockImplementationOnce(async () => Promise.resolve(receipt));

    const result = await contract.balanceOf(keys[0].address);

    expect(result.toString()).toEqual('1');
  });
});
