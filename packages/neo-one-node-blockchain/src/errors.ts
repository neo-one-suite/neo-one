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
export const BlockVerifyError = makeErrorWithCode(
  'BLOCK_VERIFICATION_FAILED',
  (hash: string) => `Block with hash: ${hash} failed to verify.`,
);
export const ConsensusPayloadVerifyError = makeErrorWithCode(
  'CONSENSUS_PAYLOAD_VERIFICATION_FAILED',
  (hash: string) => `ConsensusPayload with hash: ${hash} failed to verify`,
);
export const PersistNativeContractsError = makeErrorWithCode(
  'PERSIST_NATIVE_CONTRACTS_FAILED',
  (message?: string) =>
    `Engine state !== HALT when persisting native contract scripts${
      message !== undefined ? `. Message: ${message}` : ''
    }`,
);
export const PostPersistError = makeErrorWithCode(
  'POST_PERSIST_SCRIPT_FAILED',
  (message?: string) =>
    `Engine state !== HALT when running post persist scripts${message !== undefined ? `. Message: ${message}` : ''}`,
);
export const ContractStateFetchError = makeErrorWithCode(
  'FETCH_CONTRACT_FAILED',
  (hash: string) => `failed to fetch contract state with hash: ${hash} from storage.`,
);
export const ContractMethodError = makeErrorWithCode(
  'GET_CONTRACT_METHOD_FAILED',
  (method: string, hash: string) => `failed to fetch method ${method} from contract manifest at hash: ${hash}.`,
);
export const RecoverBlockchainError = makeErrorWithCode(
  'BLOCKCHAIN_RECOVERY_FAILED',
  (index: number) =>
    `headerIndex storage returned ${index} blocks, however we failed to find the latest block in storage.`,
);
