import { ContractMethodJSON } from './contractMethodFromJSON';

export const gasTokenMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'balanceOf',
    parameters: [
      {
        name: 'account',
        type: 'Hash160',
      },
    ],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'decimals',
    parameters: [],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'symbol',
    parameters: [],
    returntype: 'String',
    offset: 14,
    safe: true,
  },
  {
    name: 'totalSupply',
    parameters: [],
    returntype: 'Integer',
    offset: 21,
    safe: true,
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
      },
      {
        name: 'data',
        type: 'Any',
      },
    ],
    returntype: 'Boolean',
    offset: 28,
    safe: false,
  },
];
