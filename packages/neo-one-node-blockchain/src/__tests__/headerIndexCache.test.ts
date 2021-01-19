// tslint:disable: readonly-keyword no-object-mutation
import { crypto } from '@neo-one/client-common';
import { Storage } from '@neo-one/node-core';
import { storage as levelStorage } from '@neo-one/node-storage-levelup';
import { randomBytes } from 'crypto';
import LevelUp from 'levelup';
import _ from 'lodash';
import MemDown from 'memdown';
import { HeaderIndexCache } from '../HeaderIndexCache';

const getUInt = () => crypto.hash256(randomBytes(32));
const getUInts = (n: number) => _.range(n).map(getUInt);

describe('headerIndexCache tests', () => {
  const context = { messageMagic: 1951352142, validatorsCount: 7 };

  let storage: Storage;
  let db: any;
  beforeEach(() => {
    db = new LevelUp(new MemDown());
    storage = levelStorage({ db, context });
  });

  test('headerCacheIndex push 2500 hashes -- retrieves something from different headerHashLists', async () => {
    const cache = new HeaderIndexCache({ storage, initCurrentHeaderHashes: [], initStorageCount: 0 });
    const testHashes = getUInts(2500);
    // tslint:disable-next-line: no-loop-statement
    for (const hash of testHashes) {
      await cache.push(hash);
    }

    const [listZeroHash, listTwoThousandHash] = await Promise.all([cache.get(11), cache.get(2005)]);

    expect(listZeroHash.equals(testHashes[11])).toEqual(true);
    expect(listTwoThousandHash.equals(testHashes[2005])).toEqual(true);
  });
});
