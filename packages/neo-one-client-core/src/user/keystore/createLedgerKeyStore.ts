import { HDKeyStore, HDProvider } from './HDKeyStore';
import { LedgerHandler } from './LedgerHandler';
import { LedgerNanoStore } from './LedgerNanoStore';

export const createLedgerKeyStore = (provider: HDProvider) => {
  const handler = new LedgerHandler({
    getAccount: provider.getAccount,
    store: LedgerNanoStore,
  });

  return new HDKeyStore(provider, handler);
};
