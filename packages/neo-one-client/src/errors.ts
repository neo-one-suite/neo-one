import BigNumber from 'bignumber.js';
import { CustomError } from '@neo-one/utils';
import { ContractParameter, ContractParameterType } from './types';

export class InvalidContractParameterError extends CustomError {
  public readonly parameter: ContractParameter;
  public readonly expected: ContractParameterType[];
  public readonly code: string;

  constructor(parameter: ContractParameter, expected: ContractParameterType[]) {
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
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_ARGUMENT';
  }
}

export class InvalidNamedArgumentError extends InvalidArgumentError {
  public readonly code: string;

  constructor(name: string, argument: {}) {
    super(`Invalid argument for ${name}: ${String(argument)}`);
    this.code = 'INVALID_NAMED_ARGUMENT';
  }
}

export class InvocationCallError extends CustomError {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVOCATION_CALL';
  }
}

export class InvalidEventError extends CustomError {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_EVENT';
  }
}

export class InsufficientFundsError extends CustomError {
  public readonly code: string;

  constructor(total: BigNumber, expected: BigNumber) {
    super(`Found ${total.toString()} funds, required: ${expected.toString()}.`);
    this.code = 'INSUFFICIENT_FUNDS';
  }
}

export class NothingToClaimError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Nothing to claim.');
    this.code = 'NOTHING_TO_CLAIM';
  }
}

export class NothingToIssueError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Nothing to issue.');
    this.code = 'NOTHING_TO_ISSUE';
  }
}

export class NothingToTransferError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Nothing to transfer.');
    this.code = 'NOTHING_TO_TRANSFER';
  }
}

export class NoAccountError extends CustomError {
  public readonly code: string;

  constructor() {
    super('No account exists.');
    this.code = 'NO_ACCOUNT';
  }
}

export class NoContractDeployedError extends CustomError {
  public readonly code: string;

  constructor(networkType: string) {
    super(`Contract has not been deployed to network ${networkType}`);
    this.code = 'NO_CONTRACT_DEPLOYED';
  }
}

export class InvalidTransactionError extends CustomError {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_TRANSACTION';
  }
}

export class InvokeError extends CustomError {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVOKE';
  }
}

export class UnknownBlockError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Unknown block');
    this.code = 'UNKNOWN_BLOCK';
  }
}

export class RelayTransactionError extends CustomError {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.code = 'RELAY_TRANSACTION';
  }
}

export class UnknownNetworkError extends CustomError {
  public readonly code: string;

  constructor(name: string) {
    super(`Unknown network ${name}`);
    this.code = 'UNKNOWN_NETWORK';
  }
}

export class UnknownAccountError extends CustomError {
  public readonly code: string;

  constructor(address: string) {
    super(`Unknown account ${address}`);
    this.code = 'UNKNOWN_ACCOUNT';
  }
}

export class LockedAccountError extends CustomError {
  public readonly code: string;

  constructor(address: string) {
    super(`Account ${address} is locked`);
    this.code = 'LOCKED_ACCOUNT';
  }
}

export class PasswordRequiredError extends CustomError {
  public readonly code: string;

  constructor() {
    super('A password is required when creating accounts on the MainNet.');
    this.code = 'PASSWORD_REQUIRED';
  }
}
