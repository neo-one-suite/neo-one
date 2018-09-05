/* @hash 3bd31af98a6e466afc898056e930d904 */
// tslint:disable
/* eslint-disable */
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
  ],
  functions: [
    {
      constant: true,
      name: 'name',
      parameters: [],
      returnType: {
        optional: false,
        type: 'String',
      },
    },
    {
      constant: true,
      name: 'symbol',
      parameters: [],
      returnType: {
        optional: false,
        type: 'String',
      },
    },
    {
      constant: true,
      name: 'decimals',
      parameters: [],
      returnType: {
        decimals: 0,
        optional: false,
        type: 'Integer',
      },
    },
    {
      constant: true,
      name: 'totalSupply',
      parameters: [],
      returnType: {
        decimals: 8,
        optional: false,
        type: 'Integer',
      },
    },
    {
      claim: false,
      constant: true,
      name: 'balanceOf',
      parameters: [
        {
          name: 'address',
          optional: false,
          type: 'Address',
        },
      ],
      receive: false,
      returnType: {
        decimals: 8,
        optional: false,
        type: 'Integer',
      },
      send: false,
    },
    {
      claim: false,
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
      receive: false,
      returnType: {
        optional: false,
        type: 'Boolean',
      },
      send: false,
    },
    {
      claim: false,
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
      receive: false,
      returnType: {
        optional: false,
        type: 'Boolean',
      },
      send: false,
    },
    {
      name: 'refundAssets',
      parameters: [
        {
          name: 'transactionHash',
          type: 'Hash256',
        },
      ],
      returnType: {
        type: 'Boolean',
      },
      send: true,
    },
    {
      name: 'deploy',
      parameters: [],
      returnType: {
        type: 'Boolean',
      },
    },
  ],
};
