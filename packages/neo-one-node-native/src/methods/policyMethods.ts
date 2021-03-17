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
    offset: 0,
    safe: true,
  },
  {
    name: 'getFeePerByte',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'getMaxBlockSize',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'getMaxBlockSystemFee',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'getMaxTransactionsPerBlock',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'getStoragePrice',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
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
    offset: 0,
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
    offset: 0,
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
    offset: 0,
    safe: false,
  },
  {
    name: 'setMaxBlockSize',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'setMaxBlockSystemFee',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'setMaxTransactionsPerBlock',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 0,
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
    offset: 0,
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
    offset: 0,
    safe: false,
  },
];
