import {
  Client,
  LocalKeyStore,
  LocalUserAccountProvider,
  NEOONEDataProvider,
  NEOONEProvider,
  ReadClient,
} from '@neo-one/client-full';

export type WalletClient = Client<{
  readonly file: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
}>;

export type ReadWalletClient = ReadClient<NEOONEDataProvider>;
