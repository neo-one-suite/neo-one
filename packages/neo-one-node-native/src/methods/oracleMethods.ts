import { ContractMethodJSON } from './contractMethodFromJSON';

export const oracleMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'finish',
    parameters: [],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'getPrice',
    parameters: [],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'request',
    parameters: [
      {
        name: 'url',
        type: 'String',
      },
      {
        name: 'filter',
        type: 'String',
      },
      {
        name: 'callback',
        type: 'String',
      },
      {
        name: 'userData',
        type: 'Any',
      },
      {
        name: 'gasForResponse',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 14,
    safe: false,
  },
  {
    name: 'setPrice',
    parameters: [
      {
        name: 'price',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 21,
    safe: false,
  },
  {
    name: 'verify',
    parameters: [],
    returntype: 'Boolean',
    offset: 28,
    safe: true,
  },
];
