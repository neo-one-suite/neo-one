import { CustomError } from '@neo-one/utils';

export class InvalidValueArrayError extends CustomError {
  public readonly code = 'INVALID_VALUE_ARRAY';

  public constructor() {
    super('Invalid Value. Expected Array');
  }
}

export class CircularReferenceError extends CustomError {
  public readonly code = 'CIRCULAR_REFERENCE_ERROR';

  public constructor() {
    super('Circular Reference Error');
  }
}

export class InvalidValueBufferError extends CustomError {
  public readonly code = 'INVALID_VALUE_BUFFER';

  public constructor() {
    super('Invalid Value. Expected Buffer');
  }
}

export class InvalidValueEnumeratorError extends CustomError {
  public readonly code = 'INVALID_VALUE_ENUMERATOR';

  public constructor() {
    super('Invalid Value. Expected Enumerator');
  }
}

export class InvalidValueHeaderError extends CustomError {
  public readonly code = 'INVALID_VALUE_HEADER';

  public constructor() {
    super('Invalid Value. Expected Header');
  }
}

export class InvalidValueBlockError extends CustomError {
  public readonly code = 'INVALID_VALUE_BLOCK';

  public constructor() {
    super('Invalid Value. Expected Block');
  }
}

export class InvalidValueBlockBaseError extends CustomError {
  public readonly code = 'INVALID_VALUE_BLOCK_BASE';

  public constructor() {
    super('Invalid Value. Expected BlockBase');
  }
}

export class InvalidValueTransactionError extends CustomError {
  public readonly code = 'INVALID_VALUE_TRANSACTION';

  public constructor() {
    super('Invalid Value. Expected Transaction');
  }
}

export class InvalidValueAttributeError extends CustomError {
  public readonly code = 'INVALID_VALUE_ATTRIBUTE';

  public constructor() {
    super('Invalid Value. Expected Attribute');
  }
}

export class InvalidValueAttributeStackItemError extends CustomError {
  public readonly code = 'INVALID_VALUE_ATTRIBUTE_STACK_ITEM';

  public constructor() {
    super('Invalid Value. Expected AttributeStackItem');
  }
}

export class InvalidValueInputError extends CustomError {
  public readonly code = 'INVALID_VALUE_INPUT';

  public constructor() {
    super('Invalid Value. Expected Input');
  }
}

export class InvalidValueMapStackItemError extends CustomError {
  public readonly code = 'INVALID_VALUE_MAP_STACK_ITEM';

  public constructor() {
    super('Invalid Value. Expected MapStackItem');
  }
}

export class InvalidValueOutputError extends CustomError {
  public readonly code = 'INVALID_VALUE_OUTPUT';

  public constructor() {
    super('Invalid Value. Expected Output');
  }
}

export class InvalidValueAccountError extends CustomError {
  public readonly code = 'INVALID_VALUE_ACCOUNT';

  public constructor() {
    super('Invalid Value. Expected Account');
  }
}

export class InvalidValueAssetError extends CustomError {
  public readonly code = 'INVALID_VALUE_ASSET';

  public constructor() {
    super('Invalid Value. Expected Asset');
  }
}

export class InvalidValueContractError extends CustomError {
  public readonly code = 'INVALID_VALUE_CONTRACT';

  public constructor() {
    super('Invalid Value. Expected Contract');
  }
}

export class InvalidValueValidatorError extends CustomError {
  public readonly code = 'INVALID_VALUE_VALIDATOR';

  public constructor() {
    super('Invalid Value. Expected Validator');
  }
}

export class InvalidValueIteratorError extends CustomError {
  public readonly code = 'INVALID_VALUE_ITERATOR';

  public constructor() {
    super('Invalid Value. Expected Iterator');
  }
}

export class InvalidValueStorageContextStackItemError extends CustomError {
  public readonly code = 'INVALID_VALUE_STORAGE_CONTEXT_STACK_ITEM';

  public constructor() {
    super('Invalid Value. Expected StorageContextStackItem');
  }
}

export class UnsupportedStackItemSerdeError extends CustomError {
  public readonly code = 'UNSUPPORTED_STACK_ITEM_SERDE';

  public constructor() {
    super('Unsupported StackItem serde.');
  }
}

export class InvalidStorageStackItemEnumeratorError extends CustomError {
  public readonly code = 'INVALID_STORAGE_STACK_ITEM_ENUMERATOR';

  public constructor() {
    super('Current is not set. The enumerator has been fully consumed or has not ' + 'been initialized');
  }
}

export class InvalidStorageStackItemIteratorError extends CustomError {
  public readonly code = 'INVALID_STORAGE_STACK_ITEM_ITERATOR';

  public constructor() {
    super('Current is not set. The iterator has been fully consumed or has not ' + 'been initialized');
  }
}
