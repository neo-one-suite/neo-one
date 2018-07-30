import { Settings } from '@neo-one/client-core';
import { createMain } from './createMain';

// tslint:disable-next-line no-let
let mainCache: Settings | undefined;
export const main = () => {
  if (mainCache !== undefined) {
    return mainCache;
  }

  const mainSettings = createMain();
  mainCache = mainSettings;

  return mainSettings;
};
