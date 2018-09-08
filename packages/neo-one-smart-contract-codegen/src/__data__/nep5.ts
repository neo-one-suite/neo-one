import { ABI } from '@neo-one/client';

const abi = (decimals: number): ABI => ({
  functions: [
    {
      name: 'name',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
    },
    {
      name: 'decimals',
      constant: true,
      parameters: [],
      returnType: { type: 'Integer', decimals: 0 },
    },
    {
      name: 'totalSupply',
      constant: true,
      parameters: [],
      returnType: { type: 'Integer', decimals: 8 },
    },
    {
      name: 'transfer',
      parameters: [
        {
          type: 'Address',
          name: 'from',
        },
        {
          type: 'Address',
          name: 'to',
        },
        {
          type: 'Integer',
          name: 'value',
          decimals: 8,
        },
        {
          type: 'ForwardValue',
          name: 'args',
          rest: true,
        },
      ],
      returnType: { type: 'Boolean' },
    },
    {
      name: 'balanceOf',
      constant: true,
      parameters: [
        {
          type: 'Address',
          name: 'account',
        },
      ],
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'forward',
      parameters: [{ name: 'address', type: 'Address' }, { name: 'args', type: 'ForwardValue', rest: true }],
      returnType: { type: 'ForwardValue' },
    },
    {
      name: 'forwardConstant',
      constant: true,
      parameters: [{ name: 'address', type: 'Address' }, { name: 'args', type: 'ForwardValue', rest: true }],
      returnType: { type: 'ForwardValue' },
    },
    {
      name: 'forwardTo',
      parameters: [
        { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
        { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
      ],
      returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
    },
    {
      name: 'forwardToConstant',
      constant: true,
      parameters: [
        { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
        { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
      ],
      returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
    },
  ],
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          type: 'Address',
          name: 'from',
          optional: true,
        },
        {
          type: 'Address',
          name: 'to',
          optional: true,
        },
        {
          type: 'Integer',
          name: 'amount',
          decimals,
        },
      ],
    },
  ],
});

export const nep5 = {
  abi,
};
