import { ContractABIClient } from '@neo-one/client-common';

const abi = (decimals: number): ContractABIClient => ({
  hash: '',
  methods: [
    {
      name: 'name',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
      offset: 0,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
      offset: 0,
    },
    {
      name: 'decimals',
      constant: true,
      parameters: [],
      returnType: { type: 'Integer', decimals: 0 },
      offset: 0,
    },
    {
      name: 'totalSupply',
      constant: true,
      parameters: [],
      returnType: { type: 'Integer', decimals: 8 },
      offset: 0,
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
      offset: 0,
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
      offset: 0,
    },
    {
      name: 'forward',
      parameters: [
        { name: 'address', type: 'Address' },
        { name: 'args', type: 'ForwardValue', rest: true },
      ],
      returnType: { type: 'ForwardValue' },
      offset: 0,
    },
    {
      name: 'forwardConstant',
      constant: true,
      parameters: [
        { name: 'address', type: 'Address' },
        { name: 'args', type: 'ForwardValue', rest: true },
      ],
      returnType: { type: 'ForwardValue' },
      offset: 0,
    },
    {
      name: 'forwardForward',
      parameters: [
        { name: 'address', type: 'Address' },
        { name: 'args', type: 'ForwardValue', rest: true, forwardedValue: true },
      ],
      returnType: { type: 'ForwardValue', forwardedValue: true },
      offset: 0,
    },
    {
      name: 'forwardForwardConstant',
      constant: true,
      parameters: [
        { name: 'address', type: 'Address' },
        { name: 'args', type: 'ForwardValue', rest: true, forwardedValue: true },
      ],
      returnType: { type: 'ForwardValue', forwardedValue: true },
      offset: 0,
    },
    {
      name: 'forwardTo',
      parameters: [
        { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
        { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
      ],
      returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
      offset: 0,
    },
    {
      name: 'forwardToConstant',
      constant: true,
      parameters: [
        { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
        { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
      ],
      returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
      offset: 0,
    },
    {
      name: 'obj',
      parameters: [
        {
          type: 'Object',
          name: 'bar',
          properties: {
            baz: {
              type: 'Object',
              properties: {
                qux: { type: 'String' },
              },
            },
          },
        },
      ],
      returnType: { type: 'Void' },
      offset: 0,
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

export const nep17 = {
  abi,
};
