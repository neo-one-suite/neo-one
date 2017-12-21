/* @flow */
import type {
  Client,
  LocalKeyStore,
  LocalUserAccountProvider,
  NEOONEDataProvider,
  NEOONEProvider,
  ReadClient,
} from '@neo-one/client';

export type WalletClient = Client<
  LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
>;

export type ReadWalletClient = ReadClient<NEOONEDataProvider>;
