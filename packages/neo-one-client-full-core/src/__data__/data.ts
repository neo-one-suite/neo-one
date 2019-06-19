import { ABIParameter, ABIReturn, AssetType } from '@neo-one/client-common';
import { Hash256 } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { keys } from './keys';

const hash256s = {
  a: '0xb50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234',
  b: '0x0621113df436c180a47b833a2814008dc4f332915b22253651593a40a342e0fb',
  c: '0x6378f79eadb05aa5ef5bca489330e059305a1180bd69021a749f63c56e37c834',
  d: '0x5f8d7c7ec5c984cb632f4d8a5c867271197dee4a09f37cbab95d799cb292cbd1',
  e: '0x669df446205866859074e6f5658479f9f25616bc682c2e5b8e28b7dfbcf6c288',
};

const signatures = {
  a:
    'b50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234b50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234',
};

const buffers = {
  a: 'b500',
  b: '5f8d70',
};

const attributes = {
  hash1: {
    usage: 'Hash1',
    data: hash256s.a,
  },
  ecdh02: {
    usage: 'ECDH02',
    data: keys[0].publicKeyString,
  },
  description: {
    usage: 'Description',
    data: buffers.a,
  },
  script: {
    usage: 'Script',
    data: keys[0].address,
  },
  scriptScriptHash: {
    usage: 'Script',
    data: keys[0].scriptHashString,
  },
  invalid: {
    usage: 'Script',
    data: keys[0].publicKeyString,
  },
  invalidUsage: {
    usage: 'Scriptt',
    data: keys[0].address,
  },
};
const transactions = {
  contractTransaction: {
    hash: hash256s.a,
  },
};

const userAccountIDs = {
  a: {
    address: keys[0].address,
    network: 'main',
  },
  aScriptHash: {
    address: keys[0].scriptHashString,
    network: 'main',
  },
  b: {
    address: keys[1].address,
    network: 'dev',
  },
};

const bigNumbers = {
  a: new BigNumber(10),
  b: new BigNumber(100),
};

const bns = {
  a: new BN(1_00000000),
  b: new BN(10_00000000),
};

const numbers = {
  a: 20,
  b: 8,
};

const createValidAssetRegister = (type: AssetType) => ({
  type,
  name: 'Foo',
  amount: bigNumbers.a,
  precision: numbers.b,
  owner: keys[0].publicKeyString,
  admin: keys[0].address,
  issuer: keys[1].address,
});

const assetRegisters = {
  credit: createValidAssetRegister('Credit'),
  duty: createValidAssetRegister('Duty'),
  governing: createValidAssetRegister('Governing'),
  utility: createValidAssetRegister('Utility'),
  currency: createValidAssetRegister('Currency'),
  share: createValidAssetRegister('Share'),
  invoice: createValidAssetRegister('Invoice'),
  token: createValidAssetRegister('Token'),
  validScriptHash: {
    type: 'Token',
    name: 'Foo',
    amount: bigNumbers.a,
    precision: numbers.b,
    owner: keys[0].publicKeyString,
    admin: keys[0].scriptHashString,
    issuer: keys[1].scriptHashString,
  },
  invalid: {
    type: 'TokenFoo',
    name: 'Foo',
    amount: bigNumbers.a,
    precision: numbers.b,
    owner: keys[0].publicKeyString,
    admin: keys[0].scriptHashString,
    issuer: keys[1].scriptHashString,
  },
};

const contractRegisters = {
  valid: {
    script: buffers.a,
    parameters: ['String', 'Array'],
    returnType: 'Buffer',
    name: 'Token',
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The Token',
    storage: true,
    dynamicInvoke: false,
    payable: true,
  },
  invalid: {
    script: buffers.a,
    parameters: ['String', 'Array'],
    returnType: 'ByteArray',
    name: 'Token',
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The Token',
    storage: true,
    dynamicInvoke: false,
    payable: true,
  },
};

const blockFilters = {
  empty: {},
  onlyStart: { indexStart: 0 },
  onlyStop: { indexStop: 10 },
  valid: {
    indexStart: 0,
    indexStop: 5,
  },
  invalid: {
    indexStart: 5,
    indexStop: 0,
  },
};

const getOptions = {
  empty: {},
  valid: {
    timeoutMS: 5000,
  },
};

const transactionOptions = {
  empty: {},
  onlyFrom: {
    from: userAccountIDs.a,
  },
  onlyFromScriptHash: {
    from: userAccountIDs.aScriptHash,
  },
  onlyAttributes: {
    attributes: [attributes.script],
  },
  onlyAttributesScriptHash: {
    attributes: [attributes.scriptScriptHash],
  },
  onlyNetworkFee: {
    networkFee: bigNumbers.a,
  },
  valid: {
    from: userAccountIDs.a,
    attributes: [attributes.description],
    networkFee: bigNumbers.a,
  },
  invalidFrom: {
    from: {},
  },
  invalidAttributes: {
    attributes: {},
  },
  invalidNetworkFee: {
    attributes: {},
  },
};

const simpleReturnType = (returnType: ABIReturn) => ({
  functions: [
    {
      name: 'foo',
      parameters: [],
      returnType,
    },
  ],
  events: [],
});

const simpleParameterType = (paramType: ABIParameter) => ({
  functions: [
    {
      name: 'foo',
      parameters: [paramType],
      returnType: { type: 'Buffer' },
    },
  ],
  events: [],
});

const abi = {
  returnSignature: simpleReturnType({ type: 'Signature' }),
  returnBoolean: simpleReturnType({ type: 'Boolean' }),
  returnAddress: simpleReturnType({ type: 'Address' }),
  returnHash256: simpleReturnType({ type: 'Hash256' }),
  returnBuffer: simpleReturnType({ type: 'Buffer' }),
  returnPublicKey: simpleReturnType({ type: 'PublicKey' }),
  returnString: simpleReturnType({ type: 'String' }),
  returnArray: simpleReturnType({ type: 'Array', value: { type: 'Boolean' } }),
  returnVoid: simpleReturnType({ type: 'Void' }),
  returnInteger: simpleReturnType({ type: 'Integer', decimals: 8 }),
  paramSignature: simpleParameterType({ type: 'Signature', name: 'foo' }),
  paramBoolean: simpleParameterType({ type: 'Boolean', name: 'foo' }),
  paramAddress: simpleParameterType({ type: 'Address', name: 'foo' }),
  paramHash256: simpleParameterType({ type: 'Hash256', name: 'foo' }),
  paramBuffer: simpleParameterType({ type: 'Buffer', name: 'foo' }),
  paramPublicKey: simpleParameterType({ type: 'PublicKey', name: 'foo' }),
  paramString: simpleParameterType({ type: 'String', name: 'foo' }),
  paramArray: simpleParameterType({ type: 'Array', name: 'foo', value: { type: 'String' } }),
  paramVoid: simpleParameterType({ type: 'Void', name: 'foo' }),
  paramInteger: simpleParameterType({ type: 'Integer', name: 'foo', decimals: 4 }),
  invalidFunction: {
    functions: ['Foo'],
  },
  invalidFunctions: {
    functions: 'Foo',
  },
  invalidEvent: {
    events: ['Foo'],
  },
  invalidEvents: {
    events: 'Foo',
  },
  invalidType: {
    functions: [
      {
        name: 'foo',
        returnType: { type: 'Bar' },
      },
    ],
  },
  invalidParameterType: {
    functions: [
      {
        name: 'foo',
        parameters: ['Bar'],
        returnType: { type: 'Buffer' },
      },
    ],
  },
  invalidReturnType: {
    functions: [
      {
        name: 'foo',
        returnType: 'Bar',
      },
    ],
  },
};

const smartContractNetworkDefinition = {
  valid: {
    address: keys[0].address,
  },
  invalid: 'Foo',
};

const smartContractNetworksDefinition = {
  valid: {
    local: smartContractNetworkDefinition.valid,
  },
  invalid: 'Foo',
  invalidNetwork: {
    local: smartContractNetworkDefinition.invalid,
  },
};

const smartContractDefinition = {
  valid: {
    networks: smartContractNetworksDefinition.valid,
    abi: abi.paramAddress,
  },
  invalid: 'Foo',
  invalidNetworks: {
    networks: smartContractNetworksDefinition.invalid,
    abi: abi.paramAddress,
  },
  invalidNetwork: {
    networks: smartContractNetworksDefinition.invalidNetwork,
    abi: abi.paramAddress,
  },
};

const readSmartContractDefinition = {
  valid: {
    address: keys[0].address,
    abi: abi.paramAddress,
  },
  invalid: 'Foo',
};

const updateUserAccountNameOptions = {
  valid: {
    id: userAccountIDs.a,
    name: 'foo',
  },
};

const transfer = {
  a: {
    to: keys[0].address,
    amount: bigNumbers.a,
    asset: Hash256.NEO,
  },
};

const transfers = {
  valid: [transfer.a],
  invalidTransfer: ['Foo'],
};

const serializedTransaction = {
  valid: 'abcdefsgsdadasd',
};

const timestamps = {
  past: 1534365211,
};

export const data = {
  transactions,
  attributes,
  hash256s,
  buffers,
  bigNumbers,
  bns,
  numbers,
  assetRegisters,
  blockFilters,
  getOptions,
  transactionOptions,
  contractRegisters,
  abi,
  smartContractDefinition,
  readSmartContractDefinition,
  userAccountIDs,
  updateUserAccountNameOptions,
  transfers,
  serializedTransaction,
  timestamps,
  signatures,
};
