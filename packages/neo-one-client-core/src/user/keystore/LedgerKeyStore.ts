import { HDKeyStore, HDProvider } from './HDKeyStore';
import { LedgerHandler } from './LedgerHandler';

export const LedgerKeyStore = (provider: HDProvider) => {
  const handler = new LedgerHandler(provider.getAccount);

  return new HDKeyStore(provider, handler);
};
