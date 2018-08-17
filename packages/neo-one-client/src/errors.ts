import { CustomError, makeErrorWithCode } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { UserAccountID } from './types';

export const InvalidArgumentError = makeErrorWithCode(
  'INVALID_ARGUMENT',
  // tslint:disable-next-line no-any
  (typeName: string, argumentName: string, value: any, extra?: string) =>
    `Expected ${typeName} for ${argumentName}, found ${String(value)}${extra === undefined ? '' : `. ${extra}`}`,
);

export const InvalidContractArgumentCountError = makeErrorWithCode(
  'INVALID_CONTRACT_ARGUMENT_COUNT',
  // tslint:disable-next-line no-any
  (expectedLength: number, foundLength: number) => `Expected ${expectedLength} parameters, found ${foundLength}.`,
);

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

export const NothingToClaimError = makeErrorWithCode(
  'NEO_NOTHING_TO_CLAIM',
  (id: UserAccountID) => `Address ${id.address} on network ${id.network} has nothing to claim.`,
);

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
