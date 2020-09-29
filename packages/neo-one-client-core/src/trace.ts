import { ContractEventDescriptorClient } from '@neo-one/client-common';

// tslint:disable-next-line export-name
export const events: readonly ContractEventDescriptorClient[] = [
  {
    name: 'trace',
    parameters: [
      {
        type: 'Integer',
        name: 'line',
        decimals: 0,
      },
    ],
  },
  {
    name: 'error',
    parameters: [
      {
        type: 'Integer',
        name: 'line',
        decimals: 0,
      },
      {
        type: 'String',
        name: 'message',
      },
    ],
  },
  {
    name: 'console.log',
    parameters: [
      {
        type: 'Integer',
        name: 'line',
        decimals: 0,
      },
      {
        type: 'Buffer',
        name: 'args',
      },
    ],
  },
];
