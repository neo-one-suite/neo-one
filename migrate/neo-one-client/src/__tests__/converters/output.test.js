/* @flow */
import BN from 'bn.js';

import BasicClient from '../../BasicClient';

import output from '../../converters/output';
import { keys, transactions } from '../../__data__';

const assetHash = transactions.register.hashHex;
const { asset } = transactions.register;
const expected = new BN(10 * 10 ** 8);

let client = new BasicClient();
beforeEach(() => {
  client = new BasicClient();
  // $FlowFixMe
  client.getAsset = jest.fn(async (hash: Buffer) => {
    if (hash.equals(transactions.register.hash)) {
      return asset;
    }

    throw new Error('Unexpected hash');
  });
});

describe('output', () => {
  test('converts to Output', async () => {
    const outputValue = await output(client, {
      address: keys[0].address,
      asset: assetHash,
      value: 10,
    });
    expect({
      address: outputValue.address,
      asset: outputValue.asset,
      value: outputValue.value.toString(10),
    }).toEqual({
      address: keys[0].scriptHashUInt160,
      asset: transactions.register.hash,
      value: expected.toString(10),
    });
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      output(client, false);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
