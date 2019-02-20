import { publicKeyToAddress } from '@neo-one/client-common';
import { LedgerStore } from '../user/keystore/LedgerStore';

describe(`Ledger Store`, () => {
  let store: LedgerStore;

  beforeAll(async () => {
    store = await LedgerStore.init();
  });

  test(`gets pubKey`, async () => {
    const pubKey = await store.getPublicKey(0);

    expect(pubKey).toBeDefined();
    expect(pubKey.length).toEqual(66);
    expect(publicKeyToAddress(pubKey)).toBeDefined();
  });

  test(`gets multiple distinct pubKeys`, async () => {
    const values = [1, 2, 3];

    const keys = await Promise.all(values.map(async (val) => store.getPublicKey(val)));

    expect(keys[0]).not.toEqual(keys[1]);
    expect(keys[1]).not.toEqual(keys[2]);
  });

  test('signs', async () => {
    const message = Buffer.from(
      '8000000185e7e907cc5c5683e7fc926ba4be613d1810aebe14686b3675ee27d2476e5201000002e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60a08601000000000013354f4f5d3f989a221c794271e0bb2471c2735ee72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60e23f01000000000013354f4f5d3f989a221c794271e0bb2471c2735e',
      'hex',
    );

    const test = await store.sign({ message, account: 0 });
    expect(test.length).toBeGreaterThan(2);
  });
});
