/* @flow */
/* eslint-disable import/no-extraneous-dependencies */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { NEOONEDataProvider, scriptHashToAddress } from '@neo-one/client';
import { toArray } from 'ix/asynciterable/toarray';
import { utils } from '@neo-one/client-core';

// const oneRPCURL = 'https://neotracker.io/rpc';
// const waitMS = 65000
const oneRPCURL = 'http://localhost:40200/rpc';
const waitMS = 1000;
const testRPCURL = 'http://seed3.cityofzion.io:8080';

const hashes = [
  '0x8a4d2865d01ec8e6add72e3dfdd20c12f44834e3',
  '0xce3a97d7cfaa770a5e51c5b12cd1d015fbb5f87d',
  '0xd3cce84d0800172d09c88ccad61130611bd047a4',
  '0x6d36b38af912ca107f55a5daedc650054f7e4f75',
  '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
  '0xa0777c3ce2b169d4a23bcba4565e3225a0122d95',
  '0xb951ecbbc5fe37a9c280a76cb0ce0014827294cf',
  '0x0d821bd7b6d53f5c2b40e217c6defc8bbe896cf5',
  '0x546c5872a992b2754ef327154f4c119baabff65f',
  '0x2328008e6f6c7bd157a342e789389eb034d9cbc4',
  '0x7f86d61ff377f1b12e589a5907152b57e2ad9a7a',
  '0x08e8c4400f1af2c20c28e0018f29535eb85d15b6',
  '0xac116d4b8d4ca55e6b6d4ecce2192039b51cccc5',
  '0x132947096727c84c7f9e076c90f08fec3bc17f18',
  '0x45d493a6f73fa5f404244a5fb8472fc014ca5885',
  '0x2e25d2127e0240c6deaf35394702feb236d4d7fc',
  '0x34579e4614ac1a7bd295372d3de8621770c76cdc',
  '0xa721d5893480260bd28ca1f395f2c465d0b5b1c2',
  '0x891daf0e1750a1031ebe23030828ad7781d874d6',
  '0x442e7964f6486005235e87e082f56cd52aa663b8',
  '0xceab719b8baa2310f232ee0d277c061704541cfb',
  '0x23501e5fef0f67ec476406c556e91992323a0357',
  '0x0e86a40588f715fcaf7acd1812d50af478e6e917',
];

const oneProvider = new NEOONEDataProvider({
  network: 'main',
  rpcURL: oneRPCURL,
});
const testProvider = new NEOONEDataProvider({
  network: 'main',
  rpcURL: testRPCURL,
});

const convertNumber = (value: string) => {
  try {
    return utils.fromSignedBuffer(Buffer.from(value, 'hex')).toString(10);
  } catch (error) {
    return value;
  }
};

const isEqual = (item: any, testItem: any) => {
  if (testItem == null) {
    return false;
  }

  const { value } = item;
  const { value: testValue } = testItem;
  return value === testValue;
};

const reverse = (value: string) => {
  let result = '';
  let current = '';
  for (const val of value) {
    current += val;
    if (current.length === 2) {
      result = current + result;
      current = '';
    }
  }
  return result;
};

const logItem = (item: any) => {
  try {
    // eslint-disable-next-line
    console.log(convertNumber(item.value));
  } catch (error) {
    // Ignore errors
  }
};

const getStorage = async (provider: any, item: any): Promise<any> => {
  let tries = 3;
  let error;
  while (tries >= 0) {
    try {
      // eslint-disable-next-line
      const result = await provider.getStorage(item.hash, item.key);
      return result;
    } catch (err) {
      error = err;
      tries -= 1;
      // eslint-disable-next-line
      await new Promise(resolve => setTimeout(() => resolve(), waitMS));
    }
  }

  throw error;
};

const verifyStorage = async (hash: string): Promise<void> => {
  const storageItems = await toArray(
    AsyncIterableX.from(oneProvider.iterStorage(hash)),
  );
  await Promise.all(
    storageItems.map(async itemIn => {
      let [currentItem, testItem] = await Promise.all([
        getStorage(oneProvider, itemIn),
        getStorage(testProvider, itemIn),
      ]);
      if (!isEqual(currentItem, testItem)) {
        await new Promise(resolve => setTimeout(() => resolve(), 5000));
        [currentItem, testItem] = await Promise.all([
          getStorage(oneProvider, itemIn),
          getStorage(testProvider, itemIn),
        ]);
      }

      if (!isEqual(currentItem, testItem)) {
        // eslint-disable-next-line
        console.log('NOT EQUAL:');
        // eslint-disable-next-line
        console.log(currentItem.hash);
        // eslint-disable-next-line
        console.log(currentItem.key);
        try {
          // eslint-disable-next-line
          console.log(scriptHashToAddress(`0x${reverse(currentItem.key)}`));
        } catch (error) {
          try {
            // eslint-disable-next-line
            console.log(Buffer.from(currentItem.key, 'hex').toString('utf8'));
          } catch (err) {
            // Ignore errors
          }
        }
        logItem(currentItem);
        logItem(testItem);
        // eslint-disable-next-line
        console.log('\n');
      }
    }),
  );
};

const test = async () => {
  for (const hash of hashes) {
    // eslint-disable-next-line
    console.log(`Testing ${hash}`);
    // eslint-disable-next-line
    await verifyStorage(hash);
    // eslint-disable-next-line
    console.log(`Done testing ${hash}`);
  }
};

test()
  .catch(error => {
    // eslint-disable-next-line
    console.error(error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
