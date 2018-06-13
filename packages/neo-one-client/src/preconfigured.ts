import {
  NEOONEProviderOptions,
  NEOONEDataProvider,
  NEOONEProvider,
} from './provider';
import { NetworkType } from './types';
import { ReadClient } from './ReadClient';
import * as networks from './networks';

export const provider = (options?: {
  mainRPCURL?: string;
  testRPCURL?: string;
  options?: NEOONEProviderOptions[];
}) => new NEOONEProvider(options || {});

export const mainReadClient = (
  options: { rpcURL?: string; iterBlocksFetchTimeoutMS?: number } = {},
) => {
  const { rpcURL, iterBlocksFetchTimeoutMS } = options;
  return new ReadClient(
    new NEOONEDataProvider({
      network: networks.MAIN,
      rpcURL: rpcURL == null ? networks.MAIN_URL : rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
};

export const testReadClient = (
  options: { rpcURL?: string; iterBlocksFetchTimeoutMS?: number } = {},
) => {
  const { rpcURL, iterBlocksFetchTimeoutMS } = options;
  return new ReadClient(
    new NEOONEDataProvider({
      network: networks.TEST,
      rpcURL: rpcURL == null ? networks.TEST_URL : rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
};

export const createReadClient = ({
  network,
  rpcURL,
  iterBlocksFetchTimeoutMS,
}: {
  network: NetworkType;
  rpcURL: string;
  iterBlocksFetchTimeoutMS?: number;
}) =>
  new ReadClient(
    new NEOONEDataProvider({
      network,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
