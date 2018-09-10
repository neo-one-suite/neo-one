import { makeErrorWithCode } from '@neo-one/utils';

const extraInfo = (extra?: string) => (extra === undefined ? '' : extra);

export const NetworkRequiredError = makeErrorWithCode('NETWORK_REQUIRED', () => 'Wallets require a network');
export const WalletRequiredError = makeErrorWithCode(
  'WALLET_REQUIRED',
  (extra?: string) => `Wallet required to perform operation.${extraInfo(extra)}`,
);
