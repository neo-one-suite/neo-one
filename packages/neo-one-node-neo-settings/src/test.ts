import { Settings } from '@neo-one/client-core';
import { createTest } from './createTest';

// tslint:disable-next-line no-let
let testCache: Settings | undefined;
export const test = () => {
  if (testCache !== undefined) {
    return testCache;
  }

  const testSettings = createTest();
  testCache = testSettings;

  return testSettings;
};
