/* @flow */
import { crypto, common } from '@neo-one/client-core';

import * as helpers from '../helpers';

describe('helpers', () => {
  const expected = '10';
  const dummyArg = 'keyhashpublicprivatewifuintecnep25';
  const dummyVersion = 573;
  const testCases = ([
    {
      method: 'publicKeyToScriptHash',
      commonMethods: ['uInt160ToString', 'stringToECPoint'],
      args: [dummyArg],
    },
    {
      method: 'publicKeyToAddress',
      commonMethods: ['stringToECPoint'],
      args: [dummyArg],
    },
    {
      method: 'publicKeyToAddress',
      commonMethods: ['stringToECPoint'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'scriptHashToAddress',
      commonMethods: ['stringToUInt160'],
      args: [dummyArg],
    },
    {
      method: 'scriptHashToAddress',
      commonMethods: ['stringToUInt160'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'addressToScriptHash',
      commonMethods: ['uInt160ToString'],
      args: [dummyArg],
    },
    {
      method: 'addressToScriptHash',
      commonMethods: ['uInt160ToString'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'wifToPrivateKey',
      commonMethods: ['privateKeyToString'],
      args: [dummyArg],
    },
    {
      method: 'wifToPrivateKey',
      commonMethods: ['privateKeyToString'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'privateKeyToWIF',
      commonMethods: ['stringToPrivateKey'],
      args: [dummyArg],
    },
    {
      method: 'privateKeyToWIF',
      commonMethods: ['stringToPrivateKey'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'privateKeyToScriptHash',
      commonMethods: ['uInt160ToString'],
      args: [dummyArg],
    },
    {
      method: 'privateKeyToAddress',
      commonMethods: ['stringToPrivateKey'],
      args: [dummyArg],
    },
    {
      method: 'privateKeyToAddress',
      commonMethods: ['stringToPrivateKey'],
      args: [dummyArg, dummyVersion],
    },
    {
      method: 'privateKeyToPublicKey',
      commonMethods: ['ecPointToString', 'stringToPrivateKey'],
      args: [dummyArg],
    },
    {
      method: 'isNEP2',
      commonMethods: [],
      args: [dummyArg],
    },
    {
      method: 'encryptNEP2',
      commonMethods: ['stringToPrivateKey'],
      args: [{ password: dummyArg, privateKey: dummyArg }],
    },
    {
      method: 'encryptNEP2',
      commonMethods: ['stringToPrivateKey'],
      args: [
        {
          password: dummyArg,
          privateKey: dummyArg,
          addressVersion: dummyVersion,
        },
      ],
    },
    {
      method: 'decryptNEP2',
      commonMethods: ['privateKeyToString'],
      args: [{ password: dummyArg, privateKey: dummyArg }],
    },
    {
      method: 'decryptNEP2',
      commonMethods: ['privateKeyToString'],
      args: [
        {
          password: dummyArg,
          privateKey: dummyArg,
          addressVersion: dummyVersion,
        },
      ],
    },
    {
      method: 'createPrivateKey',
      commonMethods: ['privateKeyToString'],
      args: [],
    },
  ]: $FlowFixMe);

  for (const testCase of testCases) {
    const { method, commonMethods, args } = testCase;

    test(method, async () => {
      for (const commonMethod of commonMethods) {
        // $FlowFixMe
        common[commonMethod] = jest.fn(() => expected);
      }

      if (method === 'publicKeyToAddress') {
        crypto.scriptHashToAddress = jest.fn(() => expected);
        // $FlowFixMe
        crypto.publicKeyToScriptHash = jest.fn(() => expected);
      } else {
        crypto[method] = jest.fn(() => expected);
      }

      // $FlowFixMe
      const result = await helpers[method](...args);

      expect(result).toEqual(expected);
    });
  }
});
