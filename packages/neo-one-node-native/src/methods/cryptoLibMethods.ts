import { ContractMethodJSON } from './contractMethodFromJSON';

export const cryptoLibMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'ripemd160',
    parameters: [
      {
        name: 'data',
        type: 'ByteArray',
      },
    ],
    returntype: 'ByteArray',
    offset: 0,
    safe: true,
  },
  {
    name: 'sha256',
    parameters: [
      {
        name: 'data',
        type: 'ByteArray',
      },
    ],
    returntype: 'ByteArray',
    offset: 7,
    safe: true,
  },
  {
    name: 'verifyWithECDsa',
    parameters: [
      {
        name: 'message',
        type: 'ByteArray',
      },
      {
        name: 'pubkey',
        type: 'ByteArray',
      },
      {
        name: 'signature',
        type: 'ByteArray',
      },
      {
        name: 'curve',
        type: 'Integer',
      },
    ],
    returntype: 'Boolean',
    offset: 14,
    safe: true,
  },
];
