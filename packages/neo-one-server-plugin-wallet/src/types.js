/* @flow */
import type {
  Client,
  LocalKeyStore,
  LocalUserAccountProvider,
  NEOONEProvider,
} from '@neo-one/client';

export type WalletClient = Client<
  LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
>;
