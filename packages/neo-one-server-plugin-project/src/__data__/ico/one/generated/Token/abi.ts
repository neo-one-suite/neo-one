// tslint:disable
import { ABI } from '@neo-one/client';

export const tokenABI: ABI = {
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          name: 'from',
          optional: true,
          type: 'Address',
        },
        {
          name: 'to',
          optional: true,
          type: 'Address',
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
          type: 'Buffer',
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
      name: 'owner',
      returnType: {
        optional: false,
        type: 'Address',
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
          type: 'Address',
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
          type: 'Address',
        },
        {
          name: 'to',
          optional: false,
          type: 'Address',
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
      constant: false,
      name: 'issue',
      parameters: [
        {
          name: 'to',
          optional: false,
          type: 'Address',
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
      constant: false,
      name: 'deploy',
      parameters: [
        {
          name: 'owner',
          optional: true,
          type: 'Address',
        },
      ],
      returnType: {
        type: 'Boolean',
      },
      verify: false,
    },
  ],
};
