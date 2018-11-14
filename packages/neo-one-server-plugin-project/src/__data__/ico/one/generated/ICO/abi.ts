/* @hash 778600196a40f02a64df654d199b0e44 */
// tslint:disable
/* eslint-disable */
import { ABI } from '@neo-one/client';

export const icoABI: ABI = {
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          forwardedValue: false,
          name: 'from',
          optional: true,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'to',
          optional: true,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'approveSendTransfer',
      parameters: [
        {
          forwardedValue: false,
          name: 'from',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'to',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'revokeSendTransfer',
      parameters: [
        {
          forwardedValue: false,
          name: 'from',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'to',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
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
      name: 'amountPerNEO',
      parameters: [],
      returnType: {
        decimals: 0,
        forwardedValue: false,
        optional: false,
        type: 'Integer',
      },
    },
    {
      constant: true,
      name: 'owner',
      parameters: [],
      returnType: {
        forwardedValue: false,
        optional: false,
        type: 'Address',
      },
    },
    {
      constant: true,
      name: 'startTimeSeconds',
      parameters: [],
      returnType: {
        decimals: 0,
        forwardedValue: false,
        optional: false,
        type: 'Integer',
      },
    },
    {
      constant: true,
      name: 'icoDurationSeconds',
      parameters: [],
      returnType: {
        decimals: 0,
        forwardedValue: false,
        optional: false,
        type: 'Integer',
      },
    },
    {
      constant: true,
      name: 'remaining',
      parameters: [],
      returnType: {
        decimals: 8,
        forwardedValue: false,
        optional: false,
        type: 'Integer',
      },
    },
    {
      claim: false,
      constant: false,
      name: 'mintTokens',
      parameters: [],
      receive: true,
      returnType: {
        forwardedValue: false,
        optional: false,
        type: 'Boolean',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      name: 'refundAssets',
      parameters: [],
      returnType: {
        type: 'Boolean',
      },
      sendUnsafe: true,
    },
    {
      name: 'deploy',
      parameters: [
        {
          default: {
            type: 'sender',
          },
          forwardedValue: false,
          name: 'owner',
          optional: true,
          type: 'Address',
        },
        {
          decimals: 0,
          forwardedValue: false,
          name: 'startTimeSeconds',
          optional: true,
          type: 'Integer',
        },
        {
          decimals: 0,
          forwardedValue: false,
          name: 'icoDurationSeconds',
          optional: true,
          type: 'Integer',
        },
      ],
      returnType: {
        type: 'Boolean',
      },
    },
  ],
};
