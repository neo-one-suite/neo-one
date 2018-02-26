/* @flow */
import type BigNumber from 'bignumber.js';
import { CustomError } from '@neo-one/utils';

import type { ContractParameter, ContractParameterType } from './types';

export class InvalidContractParameterError extends CustomError {
  parameter: ContractParameter;
  expected: Array<ContractParameterType>;
  code: string;

  constructor(
    parameter: ContractParameter,
    expected: Array<ContractParameterType>,
  ) {
    super(
      `Expected one of ${JSON.stringify(expected)} ` +
        `ContractParameterTypes, found ${parameter.type}`,
    );
    this.parameter = parameter;
    this.expected = expected;
    this.code = 'INVALID_CONTRACT_PARAMETER';
  }
}

export class InvalidArgumentError extends CustomError {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_ARGUMENT';
  }
}

export class InvalidNamedArgumentError extends InvalidArgumentError {
  code: string;

  constructor(name: string, argument: mixed) {
    super(`Invalid argument for ${name}: ${String(argument)}`);
  }
}

export class InvocationCallError extends CustomError {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVOCATION_CALL';
  }
}

export class InvalidEventError extends CustomError {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_EVENT';
  }
}

export class InsufficientFundsError extends CustomError {
  code: string;

  constructor(total: BigNumber, expected: BigNumber) {
    super(`Found ${total.toString()} funds, required: ${expected.toString()}.`);
    this.code = 'INSUFFICIENT_FUNDS';
  }
}

export class NothingToClaimError extends CustomError {
  code: string;

  constructor() {
    super('Nothing to claim.');
    this.code = 'NOTHING_TO_CLAIM';
  }
}

export class NothingToIssueError extends CustomError {
  code: string;

  constructor() {
    super('Nothing to issue.');
    this.code = 'NOTHING_TO_ISSUE';
  }
}

export class NothingToTransferError extends CustomError {
  code: string;

  constructor() {
    super('Nothing to transfer.');
    this.code = 'NOTHING_TO_TRANSFER';
  }
}

export class NoAccountError extends CustomError {
  code: string;

  constructor() {
    super('No account exists.');
    this.code = 'NO_ACCOUNT';
  }
}

export class NoContractDeployedError extends CustomError {
  code: string;

  constructor(networkType: string) {
    super(`Contract has not been deployed to network ${networkType}`);
    this.code = 'NO_CONTRACT_DEPLOYED';
  }
}

export class InvalidTransactionError extends CustomError {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_TRANSACTION';
  }
}

export class InvokeError extends CustomError {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = 'INVOKE';
  }
}

export class UnknownBlockError extends CustomError {
  code: string;

  constructor() {
    super('Unknown block');
    this.code = 'UNKNOWN_BLOCK';
  }
}

export class RelayTransactionError extends CustomError {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'RELAY_TRANSACTION';
  }
}

export class UnknownNetworkError extends CustomError {
  code: string;

  constructor(name: string) {
    super(`Unknown network ${name}`);
    this.code = 'UNKNOWN_NETWORK';
  }
}

export class UnknownAccountError extends CustomError {
  code: string;

  constructor(address: string) {
    super(`Unknown account ${address}`);
    this.code = 'UNKNOWN_ACCOUNT';
  }
}

export class LockedAccountError extends CustomError {
  code: string;

  constructor(address: string) {
    super(`Account ${address} is locked`);
    this.code = 'LOCKED_ACCOUNT';
  }
}

export class PasswordRequiredError extends CustomError {
  code: string;

  constructor() {
    super('A password is required when creating accounts on the MainNet.');
    this.code = 'PASSWORD_REQUIRED';
  }
}
