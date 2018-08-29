import { makeErrorWithCode } from '@neo-one/utils';

export const InvalidValueArrayError = makeErrorWithCode('INVALID_VALUE_ARRAY', () => 'Invalid Value. Expected Array');
export const CircularReferenceError = makeErrorWithCode('CIRCULAR_REFERENCE_ERROR', () => 'Circular Reference Error');
export const InvalidValueBufferError = makeErrorWithCode(
  'INVALID_VALUE_BUFFER',
  () => 'Invalid Value. Expected Buffer',
);
export const InvalidValueEnumeratorError = makeErrorWithCode(
  'INVALID_VALUE_ENUMERATOR',
  () => 'Invalid Value. Expected Enumerator',
);
export const InvalidValueHeaderError = makeErrorWithCode(
  'INVALID_VALUE_HEADER',
  () => 'Invalid Value. Expected Header',
);
export const InvalidValueBlockError = makeErrorWithCode('INVALID_VALUE_BLOCK', () => 'Invalid Value. Expected Block');
export const InvalidValueBlockBaseError = makeErrorWithCode(
  'INVALID_VALUE_BLOCK_BASE',
  () => 'Invalid Value. Expected BlockBase',
);
export const InvalidValueTransactionError = makeErrorWithCode(
  'INVALID_VALUE_TRANSACTION',
  () => 'Invalid Value. Expected Transaction',
);
export const InvalidValueAttributeError = makeErrorWithCode(
  'INVALID_VALUE_ATTRIBUTE',
  () => 'Invalid Value. Expected Attribute',
);
export const InvalidValueAttributeStackItemError = makeErrorWithCode(
  'INVALID_VALUE_ATTRIBUTE_STACK_ITEM',
  () => 'Invalid Value. Expected AttributeStackItem',
);
export const InvalidValueInputError = makeErrorWithCode('INVALID_VALUE_INPUT', () => 'Invalid Value. Expected Input');
export const InvalidValueMapStackItemError = makeErrorWithCode(
  'INVALID_VALUE_MAP_STACK_ITEM',
  () => 'Invalid Value. Expected MapStackItem',
);
export const InvalidValueOutputError = makeErrorWithCode(
  'INVALID_VALUE_OUTPUT',
  () => 'Invalid Value. Expected Output',
);
export const InvalidValueAccountError = makeErrorWithCode(
  'INVALID_VALUE_ACCOUNT',
  () => 'Invalid Value. Expected Account',
);
export const InvalidValueAssetError = makeErrorWithCode('INVALID_VALUE_ASSET', () => 'Invalid Value. Expected Asset');
export const InvalidValueContractError = makeErrorWithCode(
  'INVALID_VALUE_CONTRACT',
  () => 'Invalid Value. Expected Contract',
);
export const InvalidValueValidatorError = makeErrorWithCode(
  'INVALID_VALUE_VALIDATOR',
  () => 'Invalid Value. Expected Validator',
);
export const InvalidValueIteratorError = makeErrorWithCode(
  'INVALID_VALUE_ITERATOR',
  () => 'Invalid Value. Expected Iterator',
);
export const InvalidValueStorageContextStackItemError = makeErrorWithCode(
  'INVALID_VALUE_STORAGE_CONTEXT_STACK_ITEM',
  () => 'Invalid Value. Expected StorageContextStackItem',
);
export const UnsupportedStackItemSerdeError = makeErrorWithCode(
  'UNSUPPORTED_STACK_ITEM_SERDE',
  () => 'Unsupported StackItem serde.',
);
export const InvalidStorageStackItemEnumeratorError = makeErrorWithCode(
  'INVALID_STORAGE_STACK_ITEM_ENUMERATOR',
  () => 'Current is not set. The enumerator has been fully consumed or has not ' + 'been initialized',
);
export const InvalidStorageStackItemIteratorError = makeErrorWithCode(
  'INVALID_STORAGE_STACK_ITEM_ITERATOR',
  () => 'Current is not set. The iterator has been fully consumed or has not ' + 'been initialized',
);
export const MissingStackItemKeyError = makeErrorWithCode('MISSING_STACK_ITEM_KEY', () => 'Map does not contain key.');
