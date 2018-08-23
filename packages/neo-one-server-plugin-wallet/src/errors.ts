import { makeErrorWithCode } from '@neo-one/utils';

const extraInfo = (extra?: string) => (extra === undefined ? '' : extra);

export const NetworkRequiredError = makeErrorWithCode('NETWORK_REQUIRED', () => 'Wallets require a network');
export const ABIRequiredError = makeErrorWithCode(
  'ABI_REQUIRED',
  (extra?: string) => `ABI must be specified.${extraInfo(extra)}`,
);
export const ContractOrHashRequiredError = makeErrorWithCode(
  'CONTRACT_OR_HASH_REQUIRED',
  (extra?: string) => `Contract specification or existing contract hash is required.${extraInfo(extra)}`,
);
export const WalletRequiredError = makeErrorWithCode(
  'WALLET_REQUIRED',
  (extra?: string) => `Wallet required to perform operation.${extraInfo(extra)}`,
);
