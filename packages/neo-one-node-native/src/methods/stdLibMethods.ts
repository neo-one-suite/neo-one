import { ContractMethodJSON } from './contractMethodFromJSON';

export const stdLibMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'atoi',
    parameters: [
      {
        name: 'value',
        type: 'String',
      },
    ],
    returntype: 'Integer',
    offset: 0,
    safe: true,
  },
  {
    name: 'atoi',
    parameters: [
      {
        name: 'value',
        type: 'String',
      },
      {
        name: 'base',
        type: 'Integer',
      },
    ],
    returntype: 'Integer',
    offset: 7,
    safe: true,
  },
  {
    name: 'base58Decode',
    parameters: [
      {
        name: 's',
        type: 'String',
      },
    ],
    returntype: 'ByteArray',
    offset: 14,
    safe: true,
  },
  {
    name: 'base58Encode',
    parameters: [
      {
        name: 'data',
        type: 'ByteArray',
      },
    ],
    returntype: 'String',
    offset: 21,
    safe: true,
  },
  {
    name: 'base64Decode',
    parameters: [
      {
        name: 's',
        type: 'String',
      },
    ],
    returntype: 'ByteArray',
    offset: 28,
    safe: true,
  },
  {
    name: 'base64Encode',
    parameters: [
      {
        name: 'data',
        type: 'ByteArray',
      },
    ],
    returntype: 'String',
    offset: 35,
    safe: true,
  },
  {
    name: 'deserialize',
    parameters: [
      {
        name: 'data',
        type: 'ByteArray',
      },
    ],
    returntype: 'Any',
    offset: 42,
    safe: true,
  },
  {
    name: 'itoa',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
    ],
    returntype: 'String',
    offset: 49,
    safe: true,
  },
  {
    name: 'itoa',
    parameters: [
      {
        name: 'value',
        type: 'Integer',
      },
      {
        name: 'base',
        type: 'Integer',
      },
    ],
    returntype: 'String',
    offset: 56,
    safe: true,
  },
  {
    name: 'jsonDeserialize',
    parameters: [
      {
        name: 'json',
        type: 'ByteArray',
      },
    ],
    returntype: 'Any',
    offset: 63,
    safe: true,
  },
  {
    name: 'jsonSerialize',
    parameters: [
      {
        name: 'item',
        type: 'Any',
      },
    ],
    returntype: 'ByteArray',
    offset: 70,
    safe: true,
  },
  {
    name: 'memoryCompare',
    parameters: [
      {
        name: 'str1',
        type: 'ByteArray',
      },
      {
        name: 'str2',
        type: 'ByteArray',
      },
    ],
    returntype: 'Integer',
    offset: 77,
    safe: true,
  },
  {
    name: 'memorySearch',
    parameters: [
      {
        name: 'mem',
        type: 'ByteArray',
      },
      {
        name: 'value',
        type: 'ByteArray',
      },
    ],
    returntype: 'Integer',
    offset: 84,
    safe: true,
  },
  {
    name: 'memorySearch',
    parameters: [
      {
        name: 'mem',
        type: 'ByteArray',
      },
      {
        name: 'value',
        type: 'ByteArray',
      },
      {
        name: 'start',
        type: 'Integer',
      },
    ],
    returntype: 'Integer',
    offset: 91,
    safe: true,
  },
  {
    name: 'memorySearch',
    parameters: [
      {
        name: 'mem',
        type: 'ByteArray',
      },
      {
        name: 'value',
        type: 'ByteArray',
      },
      {
        name: 'start',
        type: 'Integer',
      },
      {
        name: 'backward',
        type: 'Boolean',
      },
    ],
    returntype: 'Integer',
    offset: 98,
    safe: true,
  },
  {
    name: 'serialize',
    parameters: [
      {
        name: 'item',
        type: 'Any',
      },
    ],
    returntype: 'ByteArray',
    offset: 105,
    safe: true,
  },
  {
    name: 'stringSplit',
    parameters: [
      {
        name: 'str',
        type: 'String',
      },
      {
        name: 'separator',
        type: 'String',
      },
    ],
    returntype: 'Array',
    offset: 112,
    safe: true,
  },
  {
    name: 'stringSplit',
    parameters: [
      {
        name: 'str',
        type: 'String',
      },
      {
        name: 'separator',
        type: 'String',
      },
      {
        name: 'removeEmptyEntries',
        type: 'Boolean',
      },
    ],
    returntype: 'Array',
    offset: 119,
    safe: true,
  },
];
