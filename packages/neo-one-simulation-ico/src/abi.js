/* @flow */
const decimals = 8;

export default {
  functions: [
    {
      name: 'deploy',
      returnType: { type: 'Boolean' },
    },
    {
      name: 'circulation',
      constant: true,
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'mintTokens',
      returnType: { type: 'Boolean' },
    },
    {
      name: 'crowdsaleRegister',
      parameters: [
        {
          name: 'addresses',
          type: 'Array',
          value: { type: 'Hash160' },
        },
      ],
      returnType: { type: 'Integer', decimals: 0 },
    },
    {
      name: 'crowdsaleStatus',
      parameters: [
        {
          name: 'address',
          type: 'Hash160',
        },
      ],
      returnType: { type: 'Boolean' },
    },
    {
      name: 'crowdsaleAvailable',
      constant: true,
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'name',
      constant: true,
      returnType: { type: 'String' },
    },
    {
      name: 'decimals',
      constant: true,
      returnType: { type: 'Integer', decimals: 0 },
    },
    {
      name: 'symbol',
      constant: true,
      returnType: { type: 'String' },
    },
    {
      name: 'totalSupply',
      constant: true,
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'balanceOf',
      parameters: [
        {
          name: 'account',
          type: 'Hash160',
        },
      ],
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'transfer',
      parameters: [
        {
          name: 'from',
          type: 'Hash160',
        },
        {
          name: 'to',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals,
        },
      ],
      returnType: { type: 'Boolean' },
    },
    {
      name: 'transferFrom',
      parameters: [
        {
          name: 'from',
          type: 'Hash160',
        },
        {
          name: 'to',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals,
        },
      ],
      returnType: { type: 'Boolean' },
    },
    {
      name: 'approve',
      parameters: [
        {
          name: 'owner',
          type: 'Hash160',
        },
        {
          name: 'spender',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals,
        },
      ],
      returnType: { type: 'Boolean' },
    },
    {
      name: 'allowance',
      constant: true,
      parameters: [
        {
          name: 'owner',
          type: 'Hash160',
        },
        {
          name: 'spender',
          type: 'Hash160',
        },
      ],
      returnType: { type: 'Integer', decimals },
    },
  ],
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          name: 'from',
          type: 'Hash160',
        },
        {
          name: 'to',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals,
        },
      ],
    },
    {
      name: 'approve',
      parameters: [
        {
          name: 'from',
          type: 'Hash160',
        },
        {
          name: 'to',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals,
        },
      ],
    },
    {
      name: 'refund',
      parameters: [
        {
          name: 'to',
          type: 'Hash160',
        },
        {
          name: 'amount',
          type: 'Integer',
          decimals: 8,
        },
      ],
    },
    {
      name: 'kycRegistration',
      parameters: [
        {
          name: 'address',
          type: 'Hash160',
        },
      ],
    },
  ],
};
