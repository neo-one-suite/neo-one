/* @hash d1f060dbd871c3914c36cae1fb12f61b */
// tslint:disable
/* eslint-disable */
import { ABI } from '@neo-one/client';

export const contractABI: ABI = {
  events: [],
  functions: [
    {
      claim: false,
      constant: false,
      name: 'myFirstMethod',
      parameters: [],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
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
