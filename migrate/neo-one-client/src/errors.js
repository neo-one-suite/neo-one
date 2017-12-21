/* @flow */
import type BigNumber from 'bignumber.js';

import type {
  ContractParameter,
  ContractParameterType,
  NotificationAction,
} from './types';

export class UnknownBlockError extends Error {
  code: string;

  constructor() {
    super('Unknown block');
    this.code = 'UNKNOWN_BLOCK';
  }
}

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

  constructor(name: string, argument: mixed) {
    super(`Invalid argument for ${name}: ${String(argument)}`);
    this.code = 'INVALID_ARGUMENT';
  }
}

export class InvalidParamError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = 'INVALID_ARGUMENT';
  }
}

export class SendTransactionError extends Error {
  code: string;

  constructor() {
    super('Something went wrong!');
    this.code = 'SEND_TRANSACTION';
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

export class InvokeError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = 'INVOKE';
  }
}

export class NotificationMissingEventError extends Error {
  notification: NotificationAction;
  code: string;

  constructor(notification: NotificationAction) {
    super(`Notification missing event.`);
    this.notification = notification;
    this.code = 'NOTIFICATION_MISSING_EVENT';
  }
}
