import { Client } from './Client';
import { NEOONEDataProvider, NEOONEProvider } from './provider';
import { ReadClient } from './ReadClient';
import { LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider } from './user';

const MAIN_URL = 'https://neotracker.io/rpc';

export const createReadClient = () =>
  new ReadClient(
    new NEOONEDataProvider({
      network: 'main',
      rpcURL: MAIN_URL,
    }),
  );

export const createClient = () =>
  new Client({
    memory: new LocalUserAccountProvider({
      keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
      provider: new NEOONEProvider([{ network: 'main', rpcURL: MAIN_URL }]),
    }),
  });
