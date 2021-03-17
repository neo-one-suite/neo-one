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
    offset: 0,
    safe: false,
  },
  {
    name: 'verify',
    parameters: [],
    returntype: 'Boolean',
    offset: 0,
    safe: true,
  },
];
