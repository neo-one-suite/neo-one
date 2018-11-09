// tslint:disable variable-name
import { ABIFunction } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { data, factory } from '../../__data__';
import { Client } from '../../Client';
import { getParamsAndOptions } from '../../sc';

const wallet = factory.createUnlockedWallet();
const getCurrentNetwork = jest.fn(() => wallet.account.id.network);
const getCurrentUserAccount = jest.fn(() => wallet.account);
const client: Client = {
  getCurrentNetwork,
  getCurrentUserAccount,
  // tslint:disable-next-line no-any
} as any;

// tslint:disable-next-line:no-any
const getABIFuncTest = (func: ABIFunction) => (args: ReadonlyArray<any>, argsName: string) => {
  test(`${argsName}`, () => {
    const abi = {
      functions: [func],
    };

    const definition = factory.createSmartContractDefinition({ abi });
    const paramsAndOptions = getParamsAndOptions({
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
    expect({
      inputArgs: args,
      ...paramsAndOptions,
    }).toMatchSnapshot();
  });
};

// tslint:disable-next-line:no-any
const events: ReadonlyArray<any> = [
  {
    name: 'event',
    parameters: [],
  },
];

describe('Transfer - No Function Options', async () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.account.id }, factory.createForwardValue()];
  const testArgsForwardOptions = [true, true, new BigNumber(1), { events }, factory.createForwardValue()];
  const testArgsAllOptions = [
    true,
    true,
    new BigNumber(1),
    { from: wallet.account.id },
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
  const parameters: ReadonlyArray<any> = [
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
    { from: wallet.account.id },
    factory.createForwardValue(),
  ];
  const testArgsAllOptions = [
    true,
    true,
    new BigNumber(1),
    data.hash256s.a,
    { from: wallet.account.id },
    { events },
    factory.createForwardValue(),
  ];

  const testFunc = getABIFuncTest(func);

  testFunc(testArgsNoForward, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-transOptions');
  testFunc(testArgsAllOptions, 'all-allOptions');
});

describe('Transfer - Send - Optional ForwardValue', async () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
    { from: wallet.account.id },
    factory.createForwardValue(),
    factory.createForwardValue(),
  ];
  const testArgsNoForward = [true, true, new BigNumber(1), transfer];
  const testArgsNFWithOptions = [true, true, new BigNumber(1), transfer, { from: wallet.account.id }];

  const testFunc = getABIFuncTest(func);

  testFunc(testArgs, 'base');
  testFunc(testArgsWithOptions, 'base-transOptions');
  testFunc(testArgsNoForward, 'base-noForwardValues');
  testFunc(testArgsNFWithOptions, 'base-noForwardValues-transOptions');
});

describe('Transfer - SendUnsafe&Receive', () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
    from: wallet.account.id,
    sendFrom: [factory.createTransfer()],
    sendTo: [
      {
        amount: new BigNumber(5),
        to: wallet.account.id.address,
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

describe('Transfer - No Forward Values', async () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.account.id }];

  testFunc(testArgs, 'base');
  testFunc(testArgsWithOptions, 'base-transOptions');
});

describe('Transfer - Other Rest Param', () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.account.id }, true, false];

  testFunc(testArgsNoOptional, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'all-transOptions');
});

describe('Transfer - No Rest, No ForwardValue', () => {
  // tslint:disable-next-line:no-any
  const parameters: ReadonlyArray<any> = [
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
  const testArgsWithOptions = [true, true, new BigNumber(1), { from: wallet.account.id }];
  const testArgsAll = [true, true, new BigNumber(1), { from: wallet.account.id }, false];

  testFunc(testArgsNoOptional, 'base');
  testFunc(testArgs, 'all');
  testFunc(testArgsWithOptions, 'base-transOptions');
  testFunc(testArgsAll, 'all-transOptions');
});
