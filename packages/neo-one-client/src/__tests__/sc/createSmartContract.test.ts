// tslint:disable variable-name
import { data, factory, keys } from '../../__data__';
import { Client } from '../../Client';
import { createSmartContract } from '../../sc';
import { Action, InvokeReceipt } from '../../types';

describe('createSmartContract', () => {
  const wallet = factory.createUnlockedWallet();
  const read = jest.fn();
  const __invoke = jest.fn();
  const __call = jest.fn();
  const getCurrentAccount = jest.fn(() => wallet.account);
  const client: Client = {
    read,
    __invoke,
    __call,
    getCurrentAccount,
    // tslint:disable-next-line no-any
  } as any;

  const definition = factory.createSmartContractDefinition();
  let contract = createSmartContract({ definition, client });
  beforeEach(() => {
    contract = createSmartContract({ definition, client });
  });

  test('read', () => {
    const readSmartContract = {};
    const smartContract = jest.fn(() => readSmartContract);
    read.mockImplementationOnce(() => ({ smartContract }));

    const result = contract.read('main');

    expect(result).toBe(readSmartContract);
    expect(read.mock.calls).toMatchSnapshot();
    expect(smartContract.mock.calls).toMatchSnapshot();
  });

  test('definition', () => {
    expect(contract.definition).toBe(definition);
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

  test('createInvoke - no account', async () => {
    getCurrentAccount.mockImplementationOnce(() => undefined);

    const result = contract.transfer(keys[0].address, keys[1].address, data.bigNumbers.a, {
      transfers: [factory.createTransfer()],
    });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('createInvoke - no network', async () => {
    getCurrentAccount.mockImplementationOnce(() => ({ id: { network: 'local', address: keys[0].address } }));

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
});
