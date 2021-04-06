import { ContractMethodJSON } from './contractMethodFromJSON';

export const stdLibMethods: ReadonlyArray<ContractMethodJSON> = [
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
    offset: 0,
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
    offset: 7,
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
    offset: 14,
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
    offset: 21,
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
    offset: 28,
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
    offset: 35,
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
    offset: 42,
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
    offset: 49,
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
    offset: 56,
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
    offset: 63,
    safe: true,
  },
];
