import { ContractMethodJSON } from './contractMethodFromJSON';

export const ledgerMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'currentHash',
    parameters: [],
    returntype: 'Hash256',
    offset: 0,
    safe: true,
  },
  {
    name: 'currentIndex',
    parameters: [],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'getBlock',
    parameters: [
      {
        name: 'indexOrHash',
        type: 'ByteArray',
      },
    ],
    returntype: 'Array',
    offset: 14,
    safe: true,
  },
  {
    name: 'getTransaction',
    parameters: [
      {
        name: 'hash',
        type: 'Hash256',
      },
    ],
    returntype: 'Array',
    offset: 21,
    safe: true,
  },
  {
    name: 'getTransactionFromBlock',
    parameters: [
      {
        name: 'blockIndexOrHash',
        type: 'ByteArray',
      },
      {
        name: 'txIndex',
        type: 'Integer',
      },
    ],
    returntype: 'Array',
    offset: 28,
    safe: true,
  },
  {
    name: 'getTransactionHeight',
    parameters: [
      {
        name: 'hash',
        type: 'Hash256',
      },
    ],
    returntype: 'Integer',
    offset: 35,
    safe: true,
  },
];
