/* @flow */
import { CustomError } from '@neo-one/utils';

export class InvalidValueArrayError extends CustomError {
  code = 'INVALID_VALUE_ARRAY';

  constructor() {
    super('Invalid Value. Expected Array');
  }
}

export class InvalidValueBufferError extends CustomError {
  code = 'INVALID_VALUE_BUFFER';

  constructor() {
    super('Invalid Value. Expected Buffer');
  }
}

export class InvalidValueHeaderError extends CustomError {
  code = 'INVALID_VALUE_HEADER';

  constructor() {
    super('Invalid Value. Expected Header');
  }
}

export class InvalidValueBlockError extends CustomError {
  code = 'INVALID_VALUE_BLOCK';

  constructor() {
    super('Invalid Value. Expected Block');
  }
}

export class InvalidValueBlockBaseError extends CustomError {
  code = 'INVALID_VALUE_BLOCK_BASE';

  constructor() {
    super('Invalid Value. Expected BlockBase');
  }
}

export class InvalidValueTransactionError extends CustomError {
  code = 'INVALID_VALUE_TRANSACTION';

  constructor() {
    super('Invalid Value. Expected Transaction');
  }
}

export class InvalidValueAttributeError extends CustomError {
  code = 'INVALID_VALUE_ATTRIBUTE';

  constructor() {
    super('Invalid Value. Expected Attribute');
  }
}

export class InvalidValueAttributeStackItemError extends CustomError {
  code = 'INVALID_VALUE_ATTRIBUTE_STACK_ITEM';

  constructor() {
    super('Invalid Value. Expected AttributeStackItem');
  }
}

export class InvalidValueInputError extends CustomError {
  code = 'INVALID_VALUE_INPUT';

  constructor() {
    super('Invalid Value. Expected Input');
  }
}

export class InvalidValueMapStackItemError extends CustomError {
  code = 'INVALID_VALUE_MAP_STACK_ITEM';

  constructor() {
    super('Invalid Value. Expected MapStackItem');
  }
}

export class InvalidValueOutputError extends CustomError {
  code = 'INVALID_VALUE_OUTPUT';

  constructor() {
    super('Invalid Value. Expected Output');
  }
}

export class InvalidValueAccountError extends CustomError {
  code = 'INVALID_VALUE_ACCOUNT';

  constructor() {
    super('Invalid Value. Expected Account');
  }
}

export class InvalidValueAssetError extends CustomError {
  code = 'INVALID_VALUE_ASSET';

  constructor() {
    super('Invalid Value. Expected Asset');
  }
}

export class InvalidValueContractError extends CustomError {
  code = 'INVALID_VALUE_CONTRACT';

  constructor() {
    super('Invalid Value. Expected Contract');
  }
}

export class InvalidValueValidatorError extends CustomError {
  code = 'INVALID_VALUE_VALIDATOR';

  constructor() {
    super('Invalid Value. Expected Validator');
  }
}

export class InvalidValueIteratorError extends CustomError {
  code = 'INVALID_VALUE_ITERATOR';

  constructor() {
    super('Invalid Value. Expected Iterator');
  }
}

export class InvalidValueStorageContextStackItemError extends CustomError {
  code = 'INVALID_VALUE_STORAGE_CONTEXT_STACK_ITEM';

  constructor() {
    super('Invalid Value. Expected StorageContextStackItem');
  }
}

export class UnsupportedStackItemSerdeError extends CustomError {
  code = 'UNSUPPORTED_STACK_ITEM_SERDE';

  constructor() {
    super('Unsupported StackItem serde.');
  }
}

export class InvalidStorageStackItemIteratorError extends CustomError {
  code = 'INVALID_STORAGE_STACK_ITEM_ITERATOR';

  constructor() {
    super(
      'Current is not set. The iterator has been fully consumed or has not ' +
        'been initialized',
    );
  }
}
