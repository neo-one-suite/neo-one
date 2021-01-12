import { OracleResponseCode, UInt256Hex } from '@neo-one/client-common';
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
export const InvalidChangeViewReasonError = makeErrorWithCode(
  'INVALID_CHANGE_VIEW_REASON',
  (value: number) => `Expected ChangeViewReason, found: ${value.toString(16)}`,
);
export const UnsignedBlockError = makeErrorWithCode(
  'UNSIGNED_BLOCK',
  (stringHash: string) => `Block script does not exist because it has not been signed. @ block with hash ${stringHash}`,
);
export const InvalidStorageChangeTypeError = makeErrorWithCode(
  'INVALID_STORAGE_CHANGE_TYPE',
  (storageChangeType: number) => `Invalid Storage Change Type: ${storageChangeType}`,
);
export const InvalidIntegerStackItemError = makeErrorWithCode(
  'INVALID_INTEGER_STACK_ITEM',
  (size: number) => `value of of size ${size} too large to be represented as a BN, expected < 32`,
);
export const InvalidStackItemCastError = makeErrorWithCode(
  'INVALID_STACK_ITEM_CAST_OPERATION',
  () => 'invalid stack item conversion operation',
);
export const InvalidInteropInterfaceValueError = makeErrorWithCode(
  'INVALID_INTEROP_INTERFACE_VALUE',
  () => 'value must be defined, found undefined',
);
export const InvalidStackItemError = makeErrorWithCode(
  'INVALID_STACK_ITEM_ERROR',
  () => 'Invalid StackItem encountered',
);
export const InvalidStackItemTypeError = makeErrorWithCode(
  'INVALID_STACK_ITEM_TYPE_ERROR',
  (type: string, found?: string) =>
    `Invalid StackItemType, expected: ${type}${found !== undefined ? ` found: ${found}` : ''}`,
);
export const InvalidPrimitiveStackItemError = makeErrorWithCode(
  'INVALID_PRIMITIVE_STACK_ITEM_ERROR',
  () => 'Invalid PrimitiveStackItem found; expected one of [Boolean, ByteString, Integer].',
);
export const InvalidTransactionConsensusOptionsError = makeErrorWithCode(
  'INVALID_TRANSACTION_CONSENSUS_OPTIONS_ERROR',
  (property: string) => `Expected fully formed transaction for this method, but ${property} was undefined.`,
);
export const InvalidServerCapabilityTypeError = makeErrorWithCode(
  'INVALID_SERVER_CAPABILITY_TYPE_ERROR',
  (value: number) => `Expected type to be 0x01 or 0x02, found ${value}`,
);
export const InvalidFullNodeCapabilityTypeError = makeErrorWithCode(
  'INVALID_FULL_NODE_CAPABILITY_TYPE_ERROR',
  (value: number) => `Expected type to be 0x10, found ${value}`,
);
export const InvalidOpCodeError = makeErrorWithCode(
  'INVALID_OP_CODE_ERROR',
  (value: number) => `Cannot find fee for OpCode ${value}.`,
);
export const InvalidOracleResultError = makeErrorWithCode(
  'INVALID_ORACLE_RESULT_ERROR',
  (code: OracleResponseCode, resultLength: number) =>
    `Expected result.length to be 0 with response code ${OracleResponseCode[code]}, found: ${resultLength}`,
);
export const InvalidValidatorsError = makeErrorWithCode(
  'INVALID_VALIDATORS_ERROR',
  (length: number, index: number) =>
    `Validator index out of range when getting scriptHashes, found length ${length} but need index: ${index}.`,
);
export const InvalidPreviousHeaderError = makeErrorWithCode(
  'INVALID_PREVIOUS_HEADER_ERROR',
  (hash: UInt256Hex) => `previous header hash ${hash} did not return a valid Header from storage`,
);
