import { ContractMethodJSON } from './contractMethodFromJSON';

export const contractManagementMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'deploy',
    parameters: [
      {
        name: 'nefFile',
        type: 'ByteArray',
      },
      {
        name: 'manifest',
        type: 'ByteArray',
      },
    ],
    returntype: 'Array',
    offset: 0,
    safe: false,
  },
  {
    name: 'deploy',
    parameters: [
      {
        name: 'nefFile',
        type: 'ByteArray',
      },
      {
        name: 'manifest',
        type: 'ByteArray',
      },
      {
        name: 'data',
        type: 'Any',
      },
    ],
    returntype: 'Array',
    offset: 0,
    safe: false,
  },
  {
    name: 'destroy',
    parameters: [],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'getContract',
    parameters: [
      {
        name: 'hash',
        type: 'Hash160',
      },
    ],
    returntype: 'Array',
    offset: 0,
    safe: true,
  },
  {
    name: 'getMinimumDeploymentFee',
    parameters: [],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'setMinimumDeploymentFee',
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
    name: 'update',
    parameters: [
      {
        name: 'nefFile',
        type: 'ByteArray',
      },
      {
        name: 'manifest',
        type: 'ByteArray',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'update',
    parameters: [
      {
        name: 'nefFile',
        type: 'ByteArray',
      },
      {
        name: 'manifest',
        type: 'ByteArray',
      },
      {
        name: 'data',
        type: 'Any',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
];
