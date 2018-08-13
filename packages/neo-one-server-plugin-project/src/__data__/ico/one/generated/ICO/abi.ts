// tslint:disable
import { ABI } from '@neo-one/client';

export const iCOABI: ABI = {
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          name: 'from',
          optional: true,
          type: 'Hash160',
        },
        {
          name: 'to',
          optional: true,
          type: 'Hash160',
        },
        {
          decimals: 8,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'refund',
      parameters: [],
    },
    {
      name: 'trace',
      parameters: [
        {
          decimals: 0,
          name: 'line',
          type: 'Integer',
        },
      ],
    },
    {
      name: 'error',
      parameters: [
        {
          decimals: 0,
          name: 'line',
          type: 'Integer',
        },
        {
          name: 'message',
          type: 'String',
        },
      ],
    },
    {
      name: 'console.log',
      parameters: [
        {
          decimals: 0,
          name: 'line',
          type: 'Integer',
        },
        {
          name: 'args',
          type: 'ByteArray',
        },
      ],
    },
  ],
  functions: [
    {
      constant: true,
      name: 'name',
      returnType: {
        optional: false,
        type: 'String',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'symbol',
      returnType: {
        optional: false,
        type: 'String',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'decimals',
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'amountPerNEO',
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'owner',
      returnType: {
        optional: false,
        type: 'Hash160',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'startTimeSeconds',
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'icoDurationSeconds',
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'totalSupply',
      returnType: {
        decimals: 8,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'balanceOf',
      parameters: [
        {
          name: 'address',
          optional: false,
          type: 'Hash160',
        },
      ],
      returnType: {
        decimals: 8,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: false,
      name: 'transfer',
      parameters: [
        {
          name: 'from',
          optional: false,
          type: 'Hash160',
        },
        {
          name: 'to',
          optional: false,
          type: 'Hash160',
        },
        {
          decimals: 8,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
      returnType: {
        optional: false,
        type: 'Boolean',
      },
      verify: false,
    },
    {
      constant: true,
      name: 'remaining',
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
      verify: false,
    },
    {
      constant: false,
      name: 'mintTokens',
      parameters: [],
      returnType: {
        optional: false,
        type: 'Boolean',
      },
      verify: true,
    },
    {
      constant: false,
      name: 'deploy',
      parameters: [
        {
          name: 'owner',
          optional: true,
          type: 'Hash160',
        },
        {
          decimals: 0,
          name: 'startTimeSeconds',
          optional: true,
          type: 'Integer',
        },
        {
          decimals: 0,
          name: 'icoDurationSeconds',
          optional: true,
          type: 'Integer',
        },
      ],
      returnType: {
        type: 'Boolean',
      },
      verify: false,
    },
  ],
};
