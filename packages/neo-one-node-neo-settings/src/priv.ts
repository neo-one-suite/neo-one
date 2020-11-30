import { Settings } from '@neo-one/node-core';
import { createPriv } from './createPriv';

// tslint:disable-next-line no-let
let privCache: Settings | undefined;
export const priv = () => {
  if (privCache !== undefined) {
    return privCache;
  }

  const privateSettings = createPriv();
  privCache = privateSettings;

  return privateSettings;
};
