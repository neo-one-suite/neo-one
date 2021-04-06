import { ContractMethodJSON } from './contractMethodFromJSON';

export const nameServiceMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'addRoot',
    parameters: [
      {
        name: 'root',
        type: 'String',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'balanceOf',
    parameters: [
      {
        name: 'owner',
        type: 'Hash160',
      },
    ],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'decimals',
    parameters: [],
    returntype: 'Integer',
    offset: 14,
    safe: true,
  },
  {
    name: 'deleteRecord',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'type',
        type: 'Integer',
      },
    ],
    returntype: 'Void',
    offset: 21,
    safe: false,
  },
  {
    name: 'getPrice',
    parameters: [],
    returntype: 'Integer',
    offset: 28,
    safe: true,
  },
  {
    name: 'getRecord',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'type',
        type: 'Integer',
      },
    ],
    returntype: 'String',
    offset: 35,
    safe: true,
  },
  {
    name: 'isAvailable',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
    ],
    returntype: 'Boolean',
    offset: 42,
    safe: true,
  },
  {
    name: 'ownerOf',
    parameters: [
      {
        name: 'tokenId',
        type: 'ByteArray',
      },
    ],
    returntype: 'Hash160',
    offset: 49,
    safe: true,
  },
  {
    name: 'properties',
    parameters: [
      {
        name: 'tokenId',
        type: 'ByteArray',
      },
    ],
    returntype: 'Map',
    offset: 56,
    safe: true,
  },
  {
    name: 'register',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'owner',
        type: 'Hash160',
      },
    ],
    returntype: 'Boolean',
    offset: 63,
    safe: false,
  },
  {
    name: 'renew',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
    ],
    returntype: 'Integer',
    offset: 70,
    safe: false,
  },
  {
    name: 'resolve',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'type',
        type: 'Integer',
      },
    ],
    returntype: 'String',
    offset: 77,
    safe: true,
  },
  {
    name: 'setAdmin',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'admin',
        type: 'Hash160',
      },
    ],
    returntype: 'Void',
    offset: 84,
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
    offset: 91,
    safe: false,
  },
  {
    name: 'setRecord',
    parameters: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'type',
        type: 'Integer',
      },
      {
        name: 'data',
        type: 'String',
      },
    ],
    returntype: 'Void',
    offset: 98,
    safe: false,
  },
  {
    name: 'symbol',
    parameters: [],
    returntype: 'String',
    offset: 105,
    safe: true,
  },
  {
    name: 'tokens',
    parameters: [],
    returntype: 'InteropInterface',
    offset: 112,
    safe: true,
  },
  {
    name: 'tokensOf',
    parameters: [
      {
        name: 'owner',
        type: 'Hash160',
      },
    ],
    returntype: 'InteropInterface',
    offset: 119,
    safe: true,
  },
  {
    name: 'totalSupply',
    parameters: [],
    returntype: 'Integer',
    offset: 126,
    safe: true,
  },
  {
    name: 'transfer',
    parameters: [
      {
        name: 'to',
        type: 'Hash160',
      },
      {
        name: 'tokenId',
        type: 'ByteArray',
      },
    ],
    returntype: 'Boolean',
    offset: 133,
    safe: false,
  },
];
