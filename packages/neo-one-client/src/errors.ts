import { CustomError } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { ContractParameter, ContractParameterType } from './types';

export class InvalidContractParameterError extends CustomError {
  public readonly parameter: ContractParameter;
  public readonly expected: ReadonlyArray<ContractParameterType>;
  public readonly code: string;

  public constructor(parameter: ContractParameter, expected: ReadonlyArray<ContractParameterType>) {
    super(`Expected one of ${JSON.stringify(expected)} ` + `ContractParameterTypes, found ${parameter.type}`);

    this.parameter = parameter;
    this.expected = expected;
    this.code = 'INVALID_CONTRACT_PARAMETER';
  }
}

export class InvalidArgumentError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'INVALID_ARGUMENT';
  }
}

export class InvalidNamedArgumentError extends InvalidArgumentError {
  public readonly code: string;

  public constructor(name: string, argument: {}) {
    super(`Invalid argument for ${name}: ${String(argument)}`);
    this.code = 'INVALID_NAMED_ARGUMENT';
  }
}

export class InvocationCallError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'INVOCATION_CALL';
  }
}

export class InvalidEventError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'INVALID_EVENT';
  }
}

export class InsufficientFundsError extends CustomError {
  public readonly code: string;

  public constructor(total: BigNumber, expected: BigNumber) {
    super(`Found ${total.toString()} funds, required: ${expected.toString()}.`);
    this.code = 'INSUFFICIENT_FUNDS';
  }
}

export class FundsInUseError extends CustomError {
  public readonly code: string;

  public constructor(total: BigNumber, expected: BigNumber, numInputs: number) {
    super(
      `Found ${total.toString()} funds, required: ${expected.toString()}; You have ${numInputs} input(s) on the current block, try transfer again on the next`,
    );
    this.code = 'FUNDS_IN_USE';
  }
}

export class NothingToClaimError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Nothing to claim.');
    this.code = 'NOTHING_TO_CLAIM';
  }
}

export class NothingToIssueError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Nothing to issue.');
    this.code = 'NOTHING_TO_ISSUE';
  }
}

export class NothingToTransferError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Nothing to transfer.');
    this.code = 'NOTHING_TO_TRANSFER';
  }
}

export class NoAccountError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('No account exists.');
    this.code = 'NO_ACCOUNT';
  }
}

export class NoContractDeployedError extends CustomError {
  public readonly code: string;

  public constructor(networkType: string) {
    super(`Contract has not been deployed to network ${networkType}`);
    this.code = 'NO_CONTRACT_DEPLOYED';
  }
}

export class InvalidTransactionError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'INVALID_TRANSACTION';
  }
}

export class InvokeError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'INVOKE';
  }
}

export class UnknownBlockError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Unknown block');
    this.code = 'UNKNOWN_BLOCK';
  }
}

export class RelayTransactionError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'RELAY_TRANSACTION';
  }
}

export class UnknownNetworkError extends CustomError {
  public readonly code: string;

  public constructor(name: string) {
    super(`Unknown network ${name}`);
    this.code = 'UNKNOWN_NETWORK';
  }
}

export class UnknownAccountError extends CustomError {
  public readonly code: string;

  public constructor(address: string) {
    super(`Unknown account ${address}`);
    this.code = 'UNKNOWN_ACCOUNT';
  }
}

export class LockedAccountError extends CustomError {
  public readonly code: string;

  public constructor(address: string) {
    super(`Account ${address} is locked`);
    this.code = 'LOCKED_ACCOUNT';
  }
}

export class PasswordRequiredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('A password is required when creating accounts on the MainNet.');
    this.code = 'PASSWORD_REQUIRED';
  }
}
