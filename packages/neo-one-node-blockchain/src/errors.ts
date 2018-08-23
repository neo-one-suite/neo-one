import { makeErrorWithCode } from '@neo-one/utils';

export const GenesisBlockNotRegisteredError = makeErrorWithCode(
  'GENESIS_BLOCK_NOT_REGISTERED',
  () => 'Genesis block was not registered with storage.',
);
export const ScriptVerifyError = makeErrorWithCode('SCRIPT_VERIFY', (message: string) => message);
export const WitnessVerifyError = makeErrorWithCode('WITNESS_VERIFY', () => 'Witness verification failed.');
export const UnknownVerifyError = makeErrorWithCode('UNKNOWN_VERIFY', (message: string) => message);
export const InvalidClaimError = makeErrorWithCode('INVALID_CLAIM', () => 'invalid claim');
export const CoinClaimedError = makeErrorWithCode('COIN_CLAIMED', () => 'coin claimed');
export const CoinUnspentError = makeErrorWithCode('COIN_UNSPENT', () => 'coin unspent');
