// tslint:disable variable-name
import { ABIFunction } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { data, factory, keys } from '../../__data__';
import { Client } from '../../Client';
import { getParamsAndOptions } from '../../sc';

const wallet = factory.createUnlockedWallet();
const getCurrentNetwork = jest.fn(() => wallet.userAccount.id.network);
const getCurrentUserAccount = jest.fn(() => wallet.userAccount);
const client: Client = {
  getCurrentNetwork,
  getCurrentUserAccount,
  // tslint:disable-next-line no-any
} as any;

// tslint:disable-next-line:no-any
const getABIFuncTest = (func: ABIFunction) => (args: readonly any[], argsName: string, error?: string) => {
  test(`${argsName}`, () => {
    const abi = {
      functions: [func],
    };

    const definition = factory.createSmartContractDefinition({ abi });
    const paramsAndOptions = () =>
      getParamsAndOptions({
        definition,
        client,
        args,
        parameters: func.parameters === undefined ? [] : func.parameters,
        sendUnsafe: func.sendUnsafe === undefined ? false : func.sendUnsafe,
        receive: func.receive === undefined ? false : func.receive,
        send: func.send === undefined ? false : func.send,
        completeSend: func.completeSend === undefined ? false : func.completeSend,
        refundAssets: func.refundAssets === undefined ? false : func.refundAssets,
      });
    if (error !== undefined) {
      expect(paramsAndOptions).toThrowError(error);
    } else {
      expect({
        inputArgs: args,
        ...paramsAndOptions(),
      }).toMatchSnapshot();
    }
  });
};

// tslint:disable-next-line:no-any
const events: readonly any[] = [
  {
    name: 'event',
    parameters: [],
  },
];

describe('Transfer - No Function Options', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: false,
      rest: true,
      type: 'ForwardValue',
    },
  ];

  const func = factory.createABIFunction({
    claim: false,
    constant: false,
    name: 'transfer_base',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: false,
      type: 'Boolean',
    },
    send: false,
    sendUnsafe: false,
  });

  const testFunc = getABIFuncTest(func);

  const testArgsNoForward = [true, true, new BigNumber(1)];
  const testArgs = [true, true, new BigNumber(1), factory.createForwardValue(), factory.createForwardValue()];
  const testArgsWithOptions = [
    true,
    true,
    new BigNumber(1),
    { from: wallet.userAccount.id },
    factory.createForwardValue(),
  ];
  const testArgsForwardOptions = [true, true, new BigNumber(1), { events }, factory.createForwardValue()];
  const testArgsAllOptions = [
    true,
    true,
    new BigNumber(1),
    { from: wallet.userAccount.id },
    { events },
    factory.createForwardValue(),
  ];

  testFunc(testArgsNoForward, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-transOptions');
  testFunc(testArgsForwardOptions, 'all-forwardOptions');
  testFunc(testArgsAllOptions, 'all-allOptions');
});

describe('Transfer - Complete Send - Optional ForwardValues', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: false,
      rest: true,
      type: 'ForwardValue',
    },
  ];

  const func = factory.createABIFunction({
    name: 'transfer_completeSend',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: true,
      type: 'Boolean',
    },
    completeSend: true,
  });

  const testArgsNoForward = [true, true, new BigNumber(1), data.hash256s.a];
  const testArgs = [true, true, new BigNumber(1), data.hash256s.a, factory.createForwardValue()];
  const testArgsWithOptions = [
    true,
    true,
    new BigNumber(1),
    data.hash256s.a,
    { from: wallet.userAccount.id },
    factory.createForwardValue(),
  ];
  const testArgsAllOptions = [
    true,
    true,
    new BigNumber(1),
    data.hash256s.a,
    { from: wallet.userAccount.id },
    { events },
    factory.createForwardValue(),
  ];
  const testArgsThrow = [true, true, new BigNumber(1), { from: wallet.userAccount.id }];

  const testFunc = getABIFuncTest(func);

  testFunc(testArgsNoForward, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-transOptions');
  testFunc(testArgsAllOptions, 'all-allOptions');
  testFunc(testArgsThrow, 'throws-noHash', 'Expected to find a hash argument');
});

describe('Transfer - Send - Optional ForwardValue', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: true,
      rest: true,
      type: 'ForwardValue',
    },
  ];

  const func = factory.createABIFunction({
    name: 'transfer_send',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: true,
      type: 'Boolean',
    },
    send: true,
  });

  const transfer = factory.createTransfer();
  const testArgs = [true, true, new BigNumber(1), transfer, factory.createForwardValue(), factory.createForwardValue()];
  const testArgsWithOptions = [
    true,
    true,
    new BigNumber(1),
    transfer,
    { events },
    { from: wallet.userAccount.id },
    factory.createForwardValue(),
    factory.createForwardValue(),
  ];
  const testArgsNoForward = [true, true, new BigNumber(1), transfer];
  const testArgsNFWithOptions = [true, true, new BigNumber(1), transfer, { from: wallet.userAccount.id }];
  const testArgsThrow = [true, true, new BigNumber(1), { from: wallet.userAccount.id }];

  const testFunc = getABIFuncTest(func);

  testFunc(testArgs, 'base');
  testFunc(testArgsWithOptions, 'base-transOptions');
  testFunc(testArgsNoForward, 'base-noForwardValues');
  testFunc(testArgsNFWithOptions, 'base-noForwardValues-transOptions');
  testFunc(testArgsThrow, 'throw-noTransfer', 'Expected to find a transfer argument');
});

describe('Transfer - SendUnsafe&Receive', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: true,
      rest: true,
      type: 'ForwardValue',
    },
  ];

  const unsafeOptions = {
    from: wallet.userAccount.id,
    sendFrom: [factory.createTransfer()],
    sendTo: [
      {
        amount: new BigNumber(5),
        to: wallet.userAccount.id.address,
      },
    ],
  };

  const func = factory.createABIFunction({
    name: 'transfer_sendUnsafe&Receive',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: true,
      type: 'Boolean',
    },
    sendUnsafe: true,
    receive: true,
  });

  const baseArgs = [true, true, new BigNumber(1)];
  const testArgs = [true, true, new BigNumber(1), factory.createForwardValue()];
  const testArgsWithOptions = [true, true, new BigNumber(1), unsafeOptions, factory.createForwardValue()];
  const testArgsWithFVOptions = [true, true, new BigNumber(1), { events }, factory.createForwardValue()];
  const testArgsAllOptions = [true, true, new BigNumber(1), unsafeOptions, { events }, factory.createForwardValue()];

  const testFunc = getABIFuncTest(func);

  testFunc(baseArgs, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-WithOptions');
  testFunc(testArgsWithFVOptions, 'all-FVOptions');
  testFunc(testArgsAllOptions, 'all-allOptions');
});

describe('Transfer - No Forward Values', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
  ];

  const func = factory.createABIFunction({
    claim: false,
    constant: false,
    name: 'transfer_base',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: false,
      type: 'Boolean',
    },
    send: false,
    sendUnsafe: false,
  });

  const testFunc = getABIFuncTest(func);

  const testArgs = [true, true, new BigNumber(1)];
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.userAccount.id }];
  const testArgsThrowsSendFrom = [
    true,
    true,
    new BigNumber(1),
    { from: wallet.userAccount.id, sendFrom: [factory.createTransfer()] },
  ];
  const testArgsThrowsSendTo = [
    true,
    true,
    new BigNumber(1),
    { from: wallet.userAccount.id, sendTo: [factory.createTransfer()] },
  ];

  testFunc(testArgs, 'base');
  testFunc(testArgsWithOptions, 'base-transOptions');
  testFunc(
    testArgsThrowsSendFrom,
    'throws-sendFrom',
    `Contract ${keys[0].address} does not allow sending native assets`,
  );
  testFunc(testArgsThrowsSendTo, 'throws-sendTo', `Contract ${keys[0].address} does not accept native assets`);
});

describe('Transfer - Other Rest Param', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: false,
      rest: true,
      type: 'Boolean',
    },
  ];

  const func = factory.createABIFunction({
    claim: false,
    constant: false,
    name: 'transfer_base',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: false,
      type: 'Boolean',
    },
    send: false,
    sendUnsafe: false,
  });

  const testFunc = getABIFuncTest(func);

  const testArgs = [true, true, new BigNumber(1), true, false];
  const testArgsNoOptional = [true, true, new BigNumber(1)];
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.userAccount.id }, true, false];

  testFunc(testArgsNoOptional, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-transOptions');
});

describe('Transfer - No Rest, No ForwardValue', () => {
  // tslint:disable-next-line:no-any
  const parameters: readonly any[] = [
    {
      forwardedValue: false,
      name: 'from',
      optional: false,
      type: 'Boolean',
    },
    {
      forwardedValue: false,
      name: 'to',
      optional: false,
      type: 'Boolean',
    },
    {
      decimals: 0,
      forwardedValue: false,
      name: 'amount',
      optional: false,
      type: 'Integer',
    },
    {
      forwardedValue: false,
      name: 'approveArgs',
      optional: true,
      rest: false,
      type: 'Boolean',
    },
  ];

  const func = factory.createABIFunction({
    claim: false,
    constant: false,
    name: 'transfer_base',
    parameters,
    returnType: {
      forwardedValue: false,
      optional: false,
      type: 'Boolean',
    },
    send: false,
    sendUnsafe: false,
  });

  const testFunc = getABIFuncTest(func);

  const testArgsNoOptional = [true, true, new BigNumber(1)];
  const testArgs = [true, true, new BigNumber(1), false];
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.userAccount.id }];
  const testArgsAll = [true, true, new BigNumber(1), { from: wallet.userAccount.id }, false];

  testFunc(testArgsNoOptional, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'base-transOptions');
  testFunc(testArgsAll, 'all-transOptions');
});
