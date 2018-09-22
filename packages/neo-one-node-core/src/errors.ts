import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const ReceiveMessageTimeoutError = makeErrorWithCode(
  'RECEIVE_MESSAGE_TIMEOUT',
  (endpoint: string) => `Message with endpoint ${endpoint} timed out.`,
);
export const InvalidActionTypeError = makeErrorWithCode(
  'INVALID_ACTION_TYPE',
  (type: number) => `Expected action type, found: ${type}`,
);
export const InvalidScriptContainerTypeError = makeErrorWithCode(
  'INVALID_SCRIPT_CONTAINER_TYPE',
  (value: number) => `Expected ScriptContainerType, found: ${value.toString(16)}`,
);
export const VerifyError = makeErrorWithCode(
  'VERIFY',
  (reason?: string) => `Verification failed${reason === undefined ? '.' : `: ${reason}`}`,
);
export const InvalidConsensusMessageTypeError = makeErrorWithCode(
  'INVALID_CONSENSUS_MESSAGE_TYPE',
  (value: number) => `Expected ConsensusMessageType, found: ${value.toString(16)}`,
);
export const UnsignedBlockError = makeErrorWithCode(
  'UNSIGNED_BLOCK',
  (stringHash: string) => `Block script does not exist because it has not been signed. @ block with hash ${stringHash}`,
);
