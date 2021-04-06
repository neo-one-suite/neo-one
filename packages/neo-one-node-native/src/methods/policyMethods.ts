import { ContractMethodJSON } from './contractMethodFromJSON';

export const policyMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'blockAccount',
    parameters: [
      {
        name: 'account',
        type: 'Hash160',
      },
    ],
    returntype: 'Boolean',
    offset: 0,
    safe: false,
  },
  {
    name: 'getExecFeeFactor',
    parameters: [],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'getFeePerByte',
    parameters: [],
    returntype: 'Integer',
    offset: 14,
    safe: true,
  },
  {
    name: 'getStoragePrice',
    parameters: [],
    returntype: 'Integer',
    offset: 21,
    safe: true,
  },
  {
    name: 'isBlocked',
    parameters: [
      {
        name: 'account',
        type: 'Hash160',
      },
    ],
    returntype: 'Boolean',
    offset: 28,
    safe: true,
  },
  {
    name: 'setExecFeeFactor',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 35,
    safe: false,
  },
  {
    name: 'setFeePerByte',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 42,
    safe: false,
  },
  {
    name: 'setStoragePrice',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 49,
    safe: false,
  },
  {
    name: 'unblockAccount',
    parameters: [
      {
        name: 'account',
        type: 'Hash160',
      },
    ],
    returntype: 'Boolean',
    offset: 56,
    safe: false,
  },
];
