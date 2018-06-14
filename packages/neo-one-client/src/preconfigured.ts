import * as networks from './networks';
import { NEOONEDataProvider, NEOONEProvider, NEOONEProviderOptions } from './provider';
import { ReadClient } from './ReadClient';
import { NetworkType } from './types';

export const provider = (
  options: {
    readonly mainRPCURL?: string;
    readonly testRPCURL?: string;
    readonly options?: ReadonlyArray<NEOONEProviderOptions>;
  } = {},
) => new NEOONEProvider(options);

export const mainReadClient = (
  options: { readonly rpcURL?: string; readonly iterBlocksFetchTimeoutMS?: number } = {},
) => {
  const { rpcURL = networks.MAIN_URL, iterBlocksFetchTimeoutMS } = options;

  return new ReadClient(
    new NEOONEDataProvider({
      network: networks.MAIN,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
};

export const testReadClient = (
  options: { readonly rpcURL?: string; readonly iterBlocksFetchTimeoutMS?: number } = {},
) => {
  const { rpcURL = networks.TEST_URL, iterBlocksFetchTimeoutMS } = options;

  return new ReadClient(
    new NEOONEDataProvider({
      network: networks.TEST,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
};

export const createReadClient = ({
  network,
  rpcURL,
  iterBlocksFetchTimeoutMS,
}: {
  readonly network: NetworkType;
  readonly rpcURL: string;
  readonly iterBlocksFetchTimeoutMS?: number;
}) =>
  new ReadClient(
    new NEOONEDataProvider({
      network,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
