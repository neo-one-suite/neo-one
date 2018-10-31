import { LocalKeyStore, NEOONEDataProvider, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider, ReadClient } from '@neo-one/client-full-core';

export type WalletClient = Client<{
  readonly file: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
}>;

export type ReadWalletClient = ReadClient<NEOONEDataProvider>;
