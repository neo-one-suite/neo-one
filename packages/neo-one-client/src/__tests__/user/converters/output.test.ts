import { common, crypto, bigNumberToBN } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { keys, transactions } from '../../../__data__';
import { output } from '../../../user/converters/output';

const { address } = keys[0];

const assetHash = transactions.register.hashHex;

const value = new BigNumber('10');
const expectedValue = bigNumberToBN(value, 8);

describe('output', () => {
  test('convert to output - undefined addressVersion', () => {
    const testOutput = output({
      address,
      asset: assetHash,
      value,
    });

    expect({
      address: testOutput.address,
      asset: testOutput.asset,
      value: testOutput.value,
    }).toEqual({
      address: crypto.addressToScriptHash({
        address,
        addressVersion: common.NEO_ADDRESS_VERSION,
      }),

      asset: common.stringToUInt256(assetHash),
      value: expectedValue,
    });
  });

  test('convert to output - addressVersion', () => {
    const testOutput = output(
      {
        address,
        asset: assetHash,
        value,
      },

      common.NEO_ADDRESS_VERSION,
    );

    expect({
      address: testOutput.address,
      asset: testOutput.asset,
      value: testOutput.value,
    }).toEqual({
      address: crypto.addressToScriptHash({
        address,
        addressVersion: common.NEO_ADDRESS_VERSION,
      }),

      asset: common.stringToUInt256(assetHash),
      value: expectedValue,
    });
  });
});
