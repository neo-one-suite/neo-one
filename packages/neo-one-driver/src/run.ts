import { StorageItem } from '@neo-one/client';
import * as fs from 'fs-extra';

export interface Driver {
  readonly getHeight: () => Promise<number>;
  readonly syncTo: (height: number) => Promise<void>;
  readonly getStorageItems: () => Promise<ReadonlyArray<StorageItem>>;
  readonly backup: () => Promise<void>;
}

const roundUp = (value: number, factor: number) => value + factor - 1 - ((value - 1) % factor);

const buildStorageItemsMap = (storageItems: ReadonlyArray<StorageItem>) => {
  const mutableMap: { [key: string]: StorageItem } = {};
  // tslint:disable-next-line:no-loop-statement
  for (const storageItem of storageItems) {
    mutableMap[`${storageItem.address}:${storageItem.key}`] = storageItem;
  }

  return mutableMap;
};

interface Diff {
  readonly additional: ReadonlyArray<StorageItem>;
  readonly different: ReadonlyArray<StorageItem>;
  readonly missing: ReadonlyArray<StorageItem>;
}

const runOnce = async (test: Driver, golden: Driver, targetHeight: number): Promise<Diff> => {
  await Promise.all([test.syncTo(targetHeight), golden.syncTo(targetHeight)]);
  const [testStorageItems, goldenStorageItems] = await Promise.all([test.getStorageItems(), golden.getStorageItems()]);
  const testStorageMap = buildStorageItemsMap(testStorageItems);
  const goldenStorageMap = buildStorageItemsMap(goldenStorageItems);
  const mutableAdditionalItems = [];
  const mutableMissingItems = [];
  const mutableDifferentItems = [];
  // tslint:disable-next-line:no-loop-statement
  for (const [key, storageItem] of Object.entries(testStorageMap)) {
    if ((goldenStorageMap[key] as StorageItem | undefined) === undefined) {
      mutableAdditionalItems.push(storageItem);
    }

    if (goldenStorageMap[key].value !== storageItem.value) {
      mutableDifferentItems.push(storageItem);
    }
  }

  // tslint:disable-next-line:no-loop-statement
  for (const [key, storageItem] of Object.entries(goldenStorageMap)) {
    if ((testStorageMap[key] as StorageItem | undefined) === undefined) {
      mutableMissingItems.push(storageItem);
    }
  }

  return {
    additional: mutableAdditionalItems,
    different: mutableDifferentItems,
    missing: mutableMissingItems,
  };
};

const binarySearch = async (test: Driver, golden: Driver, min: number, max: number) => {
  let left = min;
  let right = max;
  let lastDiff: Diff = { additional: [], different: [], missing: [] };
  // tslint:disable-next-line:no-loop-statement
  while (left < right) {
    const nextHeight = Math.floor((left + right) / 2);
    const currentDiff = await runOnce(test, golden, nextHeight);
    if (hasDiff(currentDiff)) {
      lastDiff = currentDiff;
      right = nextHeight;
    } else {
      left = nextHeight;
    }
  }

  return { diffHeight: left, diff: lastDiff };
};

const hasDiff = (diff: Diff) => diff.additional.length > 0 || diff.different.length > 0 || diff.missing.length > 0;

// tslint:disable-next-line:no-any
const log = (value: any) => {
  // tslint:disable-next-line:no-console
  console.log(value);
};

const logDiff = async (diff: Diff, settings: Settings) => {
  await fs.writeFile(settings.output, JSON.stringify(diff));
};

export interface Settings {
  readonly factor: number;
  readonly endHeight: number;
  readonly output: string;
}

export const run = async (test: Driver, golden: Driver, settings: Settings) => {
  const [testHeight, goldenHeight] = await Promise.all([test.getHeight(), golden.getHeight()]);
  const startHeight = Math.max(testHeight, goldenHeight);
  let nextHeight = roundUp(startHeight, settings.factor);

  // tslint:disable-next-line:no-loop-statement
  while (nextHeight < settings.endHeight) {
    const result = await runOnce(test, golden, nextHeight);
    if (hasDiff(result)) {
      const { diffHeight, diff } = await binarySearch(test, golden, nextHeight - settings.factor, nextHeight);
      log(`Diff at ${diffHeight}.`);
      await logDiff(diff, settings);

      return;
    }

    await Promise.all([test.backup(), golden.backup()]);

    nextHeight += settings.factor;
  }
};
