// tslint:disable no-implicit-dependencies no-object-mutation no-array-mutation no-console
import { Block, ConfirmedInvocationTransaction, RawStorageChange } from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import fs from 'fs-extra';
import _ from 'lodash';
import * as os from 'os';
import * as path from 'path';
import { reverseByteString, getPartsFromKey, getValue } from './utils';

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

// const FIRST_STORAGE = {
//   folder: 'BlockStorage_1500000',
//   file: 'dump-block-1445000.json',
//   index: 1444843,
// };

const FIRST_STORAGE = {
  folder: 'BlockStorage_3500000',
  file: 'dump-block-3500000.json',
  index: 3534243,
};

// const FIRST_STORAGE = {
//   folder: 'BlockStorage_3000000',
//   file: 'dump-block-3000000.json',
//   index: 2904840,
// };

// const LOG_FILE = path.resolve(__dirname, 'log.json');

// const CHUNK_SIZE = 1;

const oneRPCURL = 'http://localhost:40200/rpc';
const oneProvider = new NEOONEDataProvider({
  network: 'main',
  rpcURL: oneRPCURL,
});

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

  block.transactions
    .filter(
      (transaction): transaction is ConfirmedInvocationTransaction => transaction.type === 'InvocationTransaction',
    )
    .forEach((invocation) => {
      let check = false;
      invocation.attributes.forEach((att) => {
        const contractHash = 'c9c0fc5a2b66a29d6b14601e752e6e1a445e088d';
        if (
          att.data.includes(contractHash)
          // ||
          // att.data.includes(reverseByteString(contractHash)) ||
          // invocation.script.includes(contractHash) ||
          // invocation.script.includes(reverseByteString(contractHash))
        ) {
          check = true;
        }
      });
      if (
        invocation.script.includes(`69${reverseByteString('a32bcf5d7082f740a4007b16e812cf66a457c3d4')}`) &&
        // invocation.script.includes(`69${reverseByteString('78e6d16b914fe15bc16150aeb11d0c2a8e532bdds')}`)
        invocation.script.includes('7769746864726177') &&
        invocation.invocationData.result.state === 'FAULT'
      ) {
        console.log(invocation.hash);
        console.log(invocation.receipt);
        console.log(invocation.invocationData.result.stack);
        console.log(invocation.invocationData);
        console.log(invocation.attributes);
        console.log('');
      }
    });

  // block.transactions
  //   .filter(
  //     (transaction): transaction is ConfirmedInvocationTransaction => transaction.type === 'InvocationTransaction',
  //   )
  //   .forEach((invocation) => {
  //     if (
  //       invocation.script.includes(
  //         `67${reverse(Buffer.from('a0777c3ce2b169d4a23bcba4565e3225a0122d95', 'hex')).toString('hex')}`,
  //       )
  //     ) {
  //       invocation.invocationData.storageChanges.forEach((change) => {
  //         const oldLogs = fs.readJsonSync(LOG_FILE);
  //         Object.keys(oldLogs).forEach((key) => {
  //           if (change.key.includes(key)) {
  //             console.log(invocation.invocationData);
  //             const newLogs = {
  //               ...oldLogs,
  //               [key]: [...oldLogs[key], invocation],
  //             };
  //             fs.writeJsonSync(LOG_FILE, newLogs);
  //             console.log('Added to log.');
  //           }
  //         });
  //       });
  //     }
  //   });

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

// const iterChunk = async (count: number) => {
//   const nextBlocks = Array.from({ length: CHUNK_SIZE }, (_value, key) => key + count);
//   await Promise.all(
//     nextBlocks.map(async (blockCount) => {
//       const block = await oneProvider.getBlock(blockCount);
//       await getOneStorageChanges(block);
//     }),
//   );
// };

// const iterChain = async () => {
//   let count = FIRST_STORAGE.index;
//   const blockHeight = await oneProvider.getBlockCount();
//   // tslint:disable-next-line no-loop-statement
//   while (count < blockHeight) {
//     await iterChunk(count);
//     count += CHUNK_SIZE;
//     if (count % 1000 === 0) {
//       console.log(`Processed ${count} blocks.`);
//     }
//   }
// };

iterDirs().catch((error) => {
  // tslint:disable-next-line:no-console
  console.error(error);
  process.exit(1);
});

// iterChain().catch((error) => {
//   // tslint:disable-next-line:no-console
//   console.error(error);
//   process.exit(1);
// });
