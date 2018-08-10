import { LedgerHandler } from '../../../user/keystore/LedgerHandler';
import { publicKeyToAddress } from '@neo-one/client';

const testMsg = `8000000185e7e907cc5c5683e7fc926ba4be613d1810aebe14686b3675ee27d2476e5201000002e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60a08601000000000013354f4f5d3f989a221c794271e0bb2471c2735ee72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60e23f01000000000013354f4f5d3f989a221c794271e0bb2471c2735e`;

describe(`Ledger Handler`, () => {
  test(`init works`, async () => {
    const handler = await LedgerHandler.init();

    const pubKey = await handler.getPublicKey(0);
    console.log(pubKey);
    console.log(publicKeyToAddress(pubKey));
  });

  test(`it signs!`, async () => {
    const handler = await LedgerHandler.init();

    console.log(`sending message: ${testMsg} for signing`);
    const message = await handler.sign({
      message: testMsg,
      account: 0,
    });

    console.log(message);
  });
});
