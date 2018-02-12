/* @flow */
import {
  type NEOONEProviderOptions,
  NEOONEDataProvider,
  NEOONEProvider,
} from './provider';
import type { NetworkType } from './types';
import ReadClient from './ReadClient';

import * as networks from './networks';

export const provider = (options?: {|
  mainRPCURL?: string,
  testRPCURL?: string,
  options?: Array<NEOONEProviderOptions>,
|}) => new NEOONEProvider(options || {});

export const mainReadClient = (optionsIn?: {|
  rpcURL?: string,
  iterBlocksFetchTimeoutMS?: number,
|}) => {
  const { rpcURL, iterBlocksFetchTimeoutMS } = optionsIn || {};
  return new ReadClient(
    new NEOONEDataProvider({
      network: networks.MAIN,
      rpcURL: rpcURL == null ? networks.MAIN_URL : rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
};

export const testReadClient = (optionsIn?: {|
  rpcURL?: string,
  iterBlocksFetchTimeoutMS?: number,
|}) => {
  const { rpcURL, iterBlocksFetchTimeoutMS } = optionsIn || {};
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
}: {|
  network: NetworkType,
  rpcURL: string,
  iterBlocksFetchTimeoutMS?: number,
|}) =>
  new ReadClient(
    new NEOONEDataProvider({
      network,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    }),
  );
