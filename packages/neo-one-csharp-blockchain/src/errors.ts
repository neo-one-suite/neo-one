import { makeErrorWithCode } from '@neo-one/utils';

export const GenesisBlockNotRegisteredError = makeErrorWithCode(
  'GENESIS_BLOCK_NOT_REGISTERED',
  () => 'Genesis block was not registered with storage.',
);
export const ScriptVerifyError = makeErrorWithCode('SCRIPT_VERIFY', (message: string) => message);
export const WitnessVerifyError = makeErrorWithCode('WITNESS_VERIFY', () => 'Witness verification failed.');
export const UnknownVerifyError = makeErrorWithCode('UNKNOWN_VERIFY', (message: string) => message);
export const InvalidClaimError = makeErrorWithCode(
  'INVALID_CLAIM',
  (asset: string, governingHash: string) =>
    `Invalid Claim. Coin with asset: ${asset} does not match governing hash: ${governingHash}`,
);
export const CoinClaimedError = makeErrorWithCode(
  'COIN_CLAIMED',
  (asset: string, value: string) => `Coin with asset: ${asset}, value: ${value} is already claimed.`,
);
export const CoinUnspentError = makeErrorWithCode(
  'COIN_UNSPENT',
  (unspentCoins: number) => `${unspentCoins} coins unspent.`,
);
