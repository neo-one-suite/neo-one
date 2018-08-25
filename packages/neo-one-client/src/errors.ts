import { makeErrorWithCode } from '@neo-one/utils';
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
  (expectedLength: number, foundLength: number) => `Expected ${expectedLength} parameters, found ${foundLength}.`,
);

export const InvocationCallError = makeErrorWithCode('INVOCATION_CALL', (message: string) => message);
export const InvalidEventError = makeErrorWithCode('INVALID_EVENT', (message: string) => message);
export const InsufficientFundsError = makeErrorWithCode(
  'INSUFFICIENT_FUNDS',
  (total: BigNumber, expected: BigNumber) => `Found ${total.toString()} funds, required: ${expected.toString()}.`,
);

export const FundsInUseError = makeErrorWithCode(
  'FUNDS_IN_USE',
  (total: BigNumber, expected: BigNumber, numInputs: number) =>
    `Found ${total.toString()} funds, required: ${expected.toString()}; You have ${numInputs} input(s) on the current block, try transfer again on the next`,
);
export const NothingToIssueError = makeErrorWithCode('NOTHING_TO_ISSUE', () => 'Nothing to issue.');
export const NothingToTransferError = makeErrorWithCode('NOTHING_TO_TRANSFER', () => 'Nothing to transfer.');
export const NoAccountError = makeErrorWithCode('NO_ACCOUNT', () => 'No account exists.');
export const NoContractDeployedError = makeErrorWithCode(
  'NO_CONTRACT_DEPLOYED',
  (networkType: string) => `Contract has not been deployed to network ${networkType}`,
);
export const InvalidTransactionError = makeErrorWithCode('INVALID_TRANSACTION', (message: string) => message);
export const InvokeError = makeErrorWithCode('INVOKE', (message: string) => message);
export const UnknownBlockError = makeErrorWithCode('UNKNOWN_BLOCK', () => 'Unknown block');
export const RelayTransactionError = makeErrorWithCode('RELAY_TRANSACTION', (message: string) => message);
export const UnknownNetworkError = makeErrorWithCode('UNKNOWN_NETWORK', (name: string) => `Unknown network ${name}`);
export const UnknownAccountError = makeErrorWithCode(
  'UNKNOWN_ACCOUNT',
  (address: string) => `Unknown account ${address}`,
);
export const LockedAccountError = makeErrorWithCode(
  'LOCKED_ACCOUNT',
  (address: string) => `Account ${address} is locked`,
);
export const PasswordRequiredError = makeErrorWithCode(
  'PASSWORD_REQUIRED',
  () => 'A password is required when creating accounts on the MainNet.',
);
export const NothingToClaimError = makeErrorWithCode(
  'NEO_NOTHING_TO_CLAIM',
  (id: UserAccountID) => `Address ${id.address} on network ${id.network} has nothing to claim.`,
);
