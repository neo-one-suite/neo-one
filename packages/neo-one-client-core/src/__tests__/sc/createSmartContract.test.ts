// tslint:disable variable-name no-non-null-assertion
import { Action, InvokeReceipt, Transaction } from '@neo-one/client-common';
import { AsyncIterableX, toArray } from '@reactivex/ix-es2015-cjs/asynciterable';
import { data, factory, keys } from '../../__data__';
import { Client } from '../../Client';
import { createSmartContract } from '../../sc';

describe('createSmartContract', () => {
  const wallet = factory.createUnlockedWallet();
  const read = jest.fn();
  const __iterActionsRaw = jest.fn();
  const __invoke = jest.fn();
  const __call = jest.fn();
  const getCurrentNetwork = jest.fn(() => wallet.userAccount.id.network);
  const getCurrentUserAccount = jest.fn(() => wallet.userAccount);
  const client: Client = {
    read,
    __iterActionsRaw,
    __invoke,
    __call,
    getCurrentNetwork,
    getCurrentUserAccount,
    // tslint:disable-next-line no-any
  } as any;

  const definition = factory.createSmartContractDefinition();
  let contract = createSmartContract({ definition, client });
  beforeEach(() => {
    contract = createSmartContract({ definition, client });
  });

  test('definition', () => {
    expect(contract.definition).toBe(definition);
  });

  test('client', () => {
    expect(contract.client).toBe(client);
  });

  const rawLog = factory.createRawLog();

  const verifyEvent = (event: Action) => {
    if (event.type !== 'Event') {
      throw new Error('For TS');
    }
    expect(event.address).toEqual(contract.definition.networks.main.address);
    expect(event.parameters.from).toEqual(keys[0].address);
    expect(event.parameters.to).toEqual(keys[1].address);
    expect(event.parameters.amount).toBeDefined();
    // tslint:disable-next-line no-non-null-assertion
    expect(event.parameters.amount!.toString()).toEqual('10');
  };

  const verifyLog = (log: Action) => {
    if (log.type !== 'Log') {
      throw new Error('For TS');
    }
    expect(log.address).toEqual(contract.definition.networks.main.address);
    expect(log.message).toEqual(rawLog.message);
  };

  test('createInvoke', async () => {
    const transaction = factory.createInvocationTransaction();
    const receipt = factory.createRawInvokeReceipt({
      actions: [factory.createRawTransferNotification(), rawLog],
      result: factory.createRawInvocationResultSuccess({
        stack: [factory.createBooleanContractParameter({ value: true })],
      }),
    });
    const transactionResult = {
      transaction,
      confirmed: async () => receipt,
    };
    __invoke.mockImplementationOnce(async () => Promise.resolve(transactionResult));

    const result = await contract.transfer(keys[0].address, keys[1].address, data.bigNumbers.a);
    const confirmResult: InvokeReceipt = await result.confirmed();

    expect(result.transaction).toEqual(transaction);
    expect(confirmResult.result.state).toEqual('HALT');
    if (confirmResult.result.state !== 'HALT') {
      throw new Error('For TS');
    }
    expect(confirmResult.result.value).toEqual(true);
    expect(confirmResult.events).toHaveLength(1);
    verifyEvent(confirmResult.events[0]);
    expect(confirmResult.logs).toHaveLength(1);
    verifyLog(confirmResult.logs[0]);
    expect(confirmResult.blockHash).toEqual(receipt.blockHash);
    expect(confirmResult.blockIndex).toEqual(receipt.blockIndex);
    expect(confirmResult.transactionIndex).toEqual(receipt.transactionIndex);
  });

  test('createInvoke - confirmed', async () => {
    const transaction = factory.createInvocationTransaction();
    const receipt = factory.createRawInvokeReceipt({
      actions: [factory.createRawTransferNotification(), rawLog],
      result: factory.createRawInvocationResultSuccess({
        stack: [factory.createBooleanContractParameter({ value: true })],
      }),
    });
    const transactionResult = {
      transaction,
      confirmed: async () => receipt,
    };
    __invoke.mockImplementationOnce(async () => Promise.resolve(transactionResult));

    const confirmResult: InvokeReceipt & { transaction: Transaction } = await contract.transfer.confirmed(
      keys[0].address,
      keys[1].address,
      data.bigNumbers.a,
    );

    expect(confirmResult.transaction).toEqual(transaction);
    expect(confirmResult.result.state).toEqual('HALT');
    if (confirmResult.result.state !== 'HALT') {
      throw new Error('For TS');
    }
    expect(confirmResult.result.value).toEqual(true);
    expect(confirmResult.events).toHaveLength(1);
    verifyEvent(confirmResult.events[0]);
    expect(confirmResult.logs).toHaveLength(1);
    verifyLog(confirmResult.logs[0]);
    expect(confirmResult.blockHash).toEqual(receipt.blockHash);
    expect(confirmResult.blockIndex).toEqual(receipt.blockIndex);
    expect(confirmResult.transactionIndex).toEqual(receipt.transactionIndex);
  });

  test('createInvoke - no network', async () => {
    // tslint:disable-next-line:no-any
    getCurrentUserAccount.mockImplementationOnce(() => ({ id: { network: 'local', address: keys[0].address } } as any));

    const result = contract.transfer(keys[0].address, keys[1].address, data.bigNumbers.a);

    await expect(result).rejects.toMatchSnapshot();
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

  const actions = [
    factory.createRawTransferNotification({ address: contract.definition.networks.main.address }),
    rawLog,
  ];
  const otherActions = [
    factory.createRawTransferNotification({ address: keys[1].address }),
    factory.createRawLog({ address: keys[1].address }),
  ];
  const allActions = actions.concat(otherActions);

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
});
