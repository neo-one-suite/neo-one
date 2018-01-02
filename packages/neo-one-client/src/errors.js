/* @flow */
import type BigNumber from 'bignumber.js';

import type { ContractParameter, ContractParameterType } from './types'; // eslint-disable-line

export class InvalidContractParameterError extends Error {
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

export class InvalidArgumentError extends Error {
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

export class InvalidEventError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_EVENT';
  }
}

export class InsufficientFundsError extends Error {
  code: string;

  constructor(total: BigNumber, expected: BigNumber) {
    super(`Found ${total.toString()} funds, required: ${expected.toString()}.`);
    this.code = 'INSUFFICIENT_FUNDS';
  }
}

export class NothingToClaimError extends Error {
  code: string;

  constructor() {
    super('Nothing to claim.');
    this.code = 'NOTHING_TO_CLAIM';
  }
}

export class NothingToIssueError extends Error {
  code: string;

  constructor() {
    super('Nothing to issue.');
    this.code = 'NOTHING_TO_ISSUE';
  }
}

export class NothingToTransferError extends Error {
  code: string;

  constructor() {
    super('Nothing to transfer.');
    this.code = 'NOTHING_TO_TRANSFER';
  }
}

export class NoAccountError extends Error {
  code: string;

  constructor() {
    super('No account exists.');
    this.code = 'NO_ACCOUNT';
  }
}

export class InvalidTransactionError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_TRANSACTION';
  }
}

export class InvokeError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = 'INVOKE';
  }
}

export class UnknownBlockError extends Error {
  code: string;

  constructor() {
    super('Unknown block');
    this.code = 'UNKNOWN_BLOCK';
  }
}

export class RelayTransactionError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'RELAY_TRANSACTION';
  }
}

export class UnknownNetworkError extends Error {
  code: string;

  constructor(name: string) {
    super(`Unknown network ${name}`);
    this.code = 'UNKNOWN_NETWORK';
  }
}

export class UnknownAccountError extends Error {
  code: string;

  constructor(address: string) {
    super(`Unknown account ${address}`);
    this.code = 'UNKNOWN_ACCOUNT';
  }
}

export class LockedAccountError extends Error {
  code: string;

  constructor(address: string) {
    super(`Account ${address} is locked`);
    this.code = 'LOCKED_ACCOUNT';
  }
}

export class PasswordRequiredError extends Error {
  code: string;

  constructor() {
    super('A password is required when creating accounts on the MainNet.');
    this.code = 'PASSWORD_REQUIRED';
  }
}
