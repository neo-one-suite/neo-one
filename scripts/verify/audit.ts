// tslint:disable no-implicit-dependencies no-object-mutation no-array-mutation no-console
import { Block, ConfirmedInvocationTransaction, RawStorageChange, scriptHashToAddress } from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { BinaryReader } from '@neo-one/node-core';
import fs from 'fs-extra';
import _ from 'lodash';
import * as os from 'os';
import * as path from 'path';

interface StorageAuditChange {
  readonly state: string;
  readonly key: string;
  readonly value: string;
}

interface StorageAuditBlock {
  readonly block: number;
  readonly size: number;
  readonly storage: ReadonlyArray<StorageAuditChange>;
}

interface StorageMismatch {
  readonly index: number;
  readonly one: ReadonlyArray<RawStorageChange>;
  readonly neo: ReadonlyArray<RawStorageChange>;
}

const NEO_STORAGE_AUDIT_PATH = path.resolve(os.homedir(), 'data', 'neo-storage-audit');

const FIRST_STORAGE = {
  folder: 'BlockStorage_1500000',
  file: 'dump-block-1445000.json',
  index: 1444843,
};

const oneRPCURL = 'http://localhost:40200/rpc';
const oneProvider = new NEOONEDataProvider({
  network: 'main',
  rpcURL: oneRPCURL,
});

const reverse = (src: Buffer): Buffer => {
  const mutableOut = Buffer.allocUnsafe(src.length);
  // tslint:disable-next-line no-loop-statement
  for (let i = 0, j = src.length - 1; i <= j; i += 1, j -= 1) {
    mutableOut[i] = src[j];
    mutableOut[j] = src[i];
  }

  return mutableOut;
};

export const getPartsFromKey = (storageKey: string) => {
  const scriptHash = `0x${reverse(Buffer.from(storageKey.slice(0, 40), 'hex')).toString('hex')}`;
  const keyRaw = storageKey.slice(40);
  const padding = parseInt(keyRaw.substring(keyRaw.length - 2), 16);
  const key = keyRaw.substring(0, keyRaw.length - (padding + 1) * 2);
  const keyFixed = _.chunk([...key], 34)
    .map((chunk) => chunk.slice(0, 32))
    .reduce((acc, chunk) => acc + chunk.join(''), '');

  return {
    scriptHash,
    address: scriptHashToAddress(scriptHash),
    key: keyFixed,
  };
};

export const getValue = (storageValue: string) => {
  const rawValue = storageValue.substring(2, storageValue.length - 2);
  const binaryReader = new BinaryReader(Buffer.from(rawValue, 'hex'));

  return binaryReader.readVarBytesLE().toString('hex');
};

const getType = (state: string): RawStorageChange['type'] =>
  state === 'Added' ? 'Add' : state === 'Changed' ? 'Modify' : 'Delete';

const getNEOStorageChangesForChange = (change: StorageAuditChange): RawStorageChange => {
  const { address, key } = getPartsFromKey(change.key);
  const type = getType(change.state);
  if (type === 'Add' || type === 'Modify') {
    return { type: 'Add', address, key, value: getValue(change.value) };
  }

  return { type, address, key };
};

const sortChanges = (changes: ReadonlyArray<RawStorageChange>) =>
  _.sortBy(changes, (change) => `${change.address}:${change.key}`);

const getNEOStorageChanges = (block: StorageAuditBlock) =>
  sortChanges(block.storage.map(getNEOStorageChangesForChange));

const getOneStorageChanges = (block: Block): ReadonlyArray<RawStorageChange> => {
  const storageChanges = block.transactions
    .filter(
      (transaction): transaction is ConfirmedInvocationTransaction => transaction.type === 'InvocationTransaction',
    )
    .map((invocation) => invocation.invocationData.storageChanges);

  const storageChangeAdds: { [K: string]: number } = {};
  const storageChangesByKey = _.flatten(storageChanges).reduce<{ [key: string]: RawStorageChange }>(
    (acc, storageChange) => {
      const storageChangeKey = `${storageChange.address}:${storageChange.key}`;
      const netAdd = storageChangeAdds[storageChangeKey];
      if ((netAdd as number | undefined) === undefined) {
        storageChangeAdds[storageChangeKey] = 0;
      }
      if (storageChange.type === 'Add' && netAdd !== 1) {
        storageChangeAdds[storageChangeKey] += 1;
      }
      if (storageChange.type === 'Delete' && netAdd !== -1) {
        storageChangeAdds[storageChangeKey] -= 1;
      }

      if (
        Object.keys(acc).includes(storageChangeKey) &&
        storageChangeAdds[storageChangeKey] === 0 &&
        storageChange.type === 'Delete'
      ) {
        // tslint:disable-next-line:no-dynamic-delete
        delete acc[storageChangeKey];
      } else {
        acc[storageChangeKey] = storageChange;
      }

      return acc;
    },
    {},
  );

  return sortChanges(Object.values(storageChangesByKey)).map((value) =>
    value.type === 'Add' || value.type === 'Modify' ? { ...value, type: 'Add' as 'Add' } : value,
  );
};

const compareStorageChangeForBlock = async (auditBlock: StorageAuditBlock): Promise<StorageMismatch | undefined> => {
  try {
    const block = await oneProvider.getBlock(auditBlock.block);
    const oneStorageChanges = getOneStorageChanges(block);
    const neoStorageChanges = getNEOStorageChanges(auditBlock);
    const mismatch = { index: block.index, one: oneStorageChanges, neo: neoStorageChanges };
    if (!_.isEqual(oneStorageChanges, neoStorageChanges)) {
      console.log('one changes missing in neo:');
      oneStorageChanges.forEach((change) => {
        let found = false;
        neoStorageChanges.forEach((neoChange) => {
          if (_.isEqual(change, neoChange)) {
            found = true;
          }
        });
        if (!found) {
          console.log(change);
        }
      });
      console.log('neo changes missing in one:');
      neoStorageChanges.forEach((neoChange) => {
        let found = false;
        oneStorageChanges.forEach((change) => {
          if (_.isEqual(change, neoChange)) {
            found = true;
          }
        });
        if (!found) {
          console.log(neoChange);
        }
      });

      return mismatch;
    }

    return undefined;
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log(`Block Failed: ${auditBlock.block}`);
    throw new Error(error);
  }
};

const iterBlocksInFile = async (filePath: string): Promise<StorageMismatch | undefined> => {
  const content = await fs.readFile(filePath, 'utf8');
  let blocks: ReadonlyArray<StorageAuditBlock>;
  try {
    blocks = JSON.parse(`${content.slice(0, -3)}]`);
    // tslint:disable-next-line:no-unused
  } catch (error) {
    try {
      blocks = JSON.parse(`${content}`);
      // tslint:disable-next-line:no-unused
    } catch (newError) {
      blocks = JSON.parse(`${content.replace(/]{/gm, ']},{').replace(/]]/gm, ']}]')}`);
    }
  }
  const processed = [];
  // tslint:disable-next-line no-loop-statement
  for (const block of blocks) {
    if (block.block >= FIRST_STORAGE.index) {
      const val = await compareStorageChangeForBlock(block);
      processed.push(val);
    }
  }

  // const processed = await Promise.all(blocks.map(compareStorageChangeForBlock));

  return processed.filter((value) => value !== undefined)[0];
};

const iterFilesInDir = async (dirPath: string): Promise<StorageMismatch | undefined> => {
  const unsortedFiles = await fs.readdir(dirPath);
  const files = _.sortBy(unsortedFiles, (name) => parseInt(name.slice('dump-block-'.length, -'.json'.length), 10));
  const firstIndex = dirPath.includes(FIRST_STORAGE.folder)
    ? files.findIndex((fileName) => fileName === FIRST_STORAGE.file)
    : 0;

  // tslint:disable-next-line:no-loop-statement
  for (const fileName of files.slice(firstIndex)) {
    const value = await iterBlocksInFile(path.resolve(dirPath, fileName));
    if (value !== undefined) {
      return value;
    }
    console.log(`Processed ${fileName}`);
  }

  return undefined;
};

const iterDirs = async () => {
  const allDirs = await fs.readdir(NEO_STORAGE_AUDIT_PATH);
  const dirs = _.sortBy(allDirs.filter((dirName) => dirName.includes('BlockStorage')), (name) =>
    parseInt(name.slice('BlockStorage_'.length), 10),
  );
  const firstIndex = dirs.findIndex((dirName) => dirName === FIRST_STORAGE.folder);

  // tslint:disable-next-line:no-loop-statement
  for (const dirName of dirs.slice(firstIndex)) {
    const value = await iterFilesInDir(path.resolve(NEO_STORAGE_AUDIT_PATH, dirName));
    if (value !== undefined) {
      console.log(`full storage changes:`);
      console.log(value);

      return;
    }
  }
};

iterDirs().catch((error) => {
  // tslint:disable-next-line:no-console
  console.error(error);
  process.exit(1);
});
