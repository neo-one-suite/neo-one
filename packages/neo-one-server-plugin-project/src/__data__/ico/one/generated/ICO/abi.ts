// tslint:disable
import { ABI } from '@neo-one/client';

export const icoABI: ABI = {
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
          type: 'Buffer',
        },
      ],
    },
  ],
  functions: [
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
        type: 'Address',
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
      name: 'remaining',
      returnType: {
        decimals: 8,
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
          type: 'Address',
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
