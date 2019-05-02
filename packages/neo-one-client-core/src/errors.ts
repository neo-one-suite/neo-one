import { AddressString, JSONRPCErrorResponse, UserAccountID } from '@neo-one/client-common';
import { makeErrorWithCode } from '@neo-one/utils';
import BigNumber from 'bignumber.js';

export const UnknownNetworkError = makeErrorWithCode('UNKNOWN_NETWORK', (name: string) => `Unknown network ${name}`);
export const UnknownAccountError = makeErrorWithCode(
  'UNKNOWN_ACCOUNT',
  (address: string) => `Unknown account ${address}`,
);
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
export const NoAccountError = makeErrorWithCode('NO_ACCOUNT', () => 'No account exists.');
export const CannotSendToContractError = makeErrorWithCode(
  'CANNOT_SEND_TO_CONTRACT',
  (address: AddressString) => `Contract ${address} does not accept native assets`,
);
export const CannotSendFromContractError = makeErrorWithCode(
  'CANNOT_SEND_FROM_CONTRACT',
  (address: AddressString) => `Contract ${address} does not allow sending native assets`,
);
export const NoContractDeployedError = makeErrorWithCode(
  'NO_CONTRACT_DEPLOYED',
  (networkType: string) => `Contract has not been deployed to network ${networkType}`,
);
export const JSONRPCError = makeErrorWithCode(
  'JSON_RPC',
  (responseError: JSONRPCErrorResponse) => `${responseError.message}:${responseError.code}`,
);
export const InvalidRPCResponseError = makeErrorWithCode(
  'INVALID_RPC_RESPONSE',
  () => 'Did not receive valid rpc response',
);
export const HTTPError = makeErrorWithCode('HTTP', (status: number, text?: string) =>
  text === undefined ? `HTTP Error ${status}` : `HTTP Error ${status}: ${text}`,
);
export const UnknownBlockError = makeErrorWithCode('UNKNOWN_BLOCK', () => 'Unknown block');
export const NothingToSendError = makeErrorWithCode('NOTHING_TO_SEND', () => 'Nothing to send.');
export const NothingToRefundError = makeErrorWithCode('NOTHING_TO_REFUND', () => 'Nothing to refund.');
export const NothingToClaimError = makeErrorWithCode(
  'NEO_NOTHING_TO_CLAIM',
  (id: UserAccountID) => `Address ${id.address} on network ${id.network} has nothing to claim.`,
);
export const InvalidTransactionError = makeErrorWithCode('INVALID_TRANSACTION', (message: string) => message);
export const InvokeError = makeErrorWithCode('INVOKE', (message: string) => message);
export const InsufficientFundsError = makeErrorWithCode(
  'INSUFFICIENT_FUNDS',
  (total: BigNumber, expected: BigNumber) => `Found ${total.toString()} funds, required: ${expected.toString()}.`,
);
export const InsufficientSystemFeeError = makeErrorWithCode(
  'INSUFFICIENT_SYSTEM_FEE',
  (total: BigNumber, expected: BigNumber) =>
    `Found ${total.toString()} allowed system fee, required: ${expected.toString()}.`,
);
export const FundsInUseError = makeErrorWithCode(
  'FUNDS_IN_USE',
  (total: BigNumber, expected: BigNumber, numInputs: number) =>
    `Found ${total.toString()} funds, required: ${expected.toString()}; You have ${numInputs} input(s) on the current block, try transfer again on the next`,
);
export const MissingTransactionDataError = makeErrorWithCode(
  'MISSING_TRANSACTION_DATA',
  (hash: string) => `Missing transaction data for transaction ${hash}`,
);
export const RelayTransactionError = makeErrorWithCode('RELAY_TRANSACTION', (message: string) => message);
export const LockedAccountError = makeErrorWithCode(
  'LOCKED_ACCOUNT',
  (address: string) => `Account ${address} is locked`,
);
export const PasswordRequiredError = makeErrorWithCode(
  'PASSWORD_REQUIRED',
  () => 'A password is required when creating accounts on the MainNet.',
);
export const NothingToTransferError = makeErrorWithCode('NOTHING_TO_TRANSFER', () => 'Nothing to transfer.');
export const LedgerNotSupportedError = makeErrorWithCode(
  'LEDGER_NOT_SUPPORTED',
  () => 'Ledger not supported by your machine.',
);
export const LedgerNotDetectedError = makeErrorWithCode(
  'LEDGER_NOT_DETECTED',
  () => 'Ledger not detected by your machine.',
);
export const LedgerStatusCodeError = makeErrorWithCode(
  'BAD_LEDGER_STATUS_CODE',
  (code: string) => `Received unknown status code ${code} from ledger.`,
);
export const LedgerMessageSizeError = makeErrorWithCode(
  'LEDGER_MESSAGE_OVERSIZED',
  () => 'Ledger signing failed, message too large. [CODE: 6d08]',
);
export const LedgerNEOAppError = makeErrorWithCode(
  'LEDGER_NEO_APP_ERROR',
  () => 'Ledger NEO App error, check ledger. [CODE: 6e00]',
);
export const LedgerTransactionDenied = makeErrorWithCode(
  'LEDGER_TRANSACTION_DENIED',
  () => 'Ledger transaction denied. [CODE: 6985]',
);
export const LedgerParseError = makeErrorWithCode(
  'LEDGER_PARSE_ERROR',
  () => 'Ledger transaction parsing error. [CODE: 6d07]',
);
export const DeleteUserAccountUnsupportedError = makeErrorWithCode(
  'DELETE_USER_ACCOUNT_UNSUPPORTED',
  (id: UserAccountID) =>
    `Deleting the user account with network ${id.network} and address ${id.address} is not supported`,
);
export const UpdateUserAccountUnsupportedError = makeErrorWithCode(
  'UPDATE_USER_ACCOUNT_NAME_UNSUPPORTED',
  (id: UserAccountID) =>
    `Updating the name of user account with network ${id.network} and address ${id.address} is not supported`,
);
export const TransferArgumentExpectedError = makeErrorWithCode(
  'TRANSFER_ARGUMENT_EXPECTED',
  () => 'Expected to find a transfer argument',
);
export const HashArgumentExpectedError = makeErrorWithCode(
  'HASH_ARGUMENT_EXPECTED',
  () => 'Expected to find a hash argument',
);
export const NEOONEOneDataProviderSetRPCURLError = makeErrorWithCode(
  'INVALID_SET_RPC_URL_CALL',
  () => 'Cannot set rpcURL for NEOONEOneDataProvider',
);
export const InvalidHDAccountPermissionError = makeErrorWithCode(
  'INVALID_HD_ACCOUNT_PERMISSION',
  (account: readonly [number, number, number]) => `Invalid permission for account at path: ${account}`,
);
export const UndiscoverableWalletError = makeErrorWithCode(
  'UNDISCOVERABLE_WALLET',
  (index: number) => `Invalid access to discover wallet at index: ${index}`,
);
export const UndiscoverableChainError = makeErrorWithCode(
  'UNDISCOVERABLE_CHAIN',
  (path: readonly [number, number]) => `Invalid access to discover chain at index: ${path}`,
);
export const HDMasterDuplicateError = makeErrorWithCode(
  'HD_MASTER_DUPLICATE_ERROR',
  () => 'Storage returned multiple master keys',
);
export const InvalidHDStoredPathError = makeErrorWithCode(
  'INVALID_HD_STORED_PATH',
  (path: string) => `Storage returned an invalid key-path: ${path}`,
);
export const InvalidMasterPathError = makeErrorWithCode(
  'INVALID_HD_MASTER_PATH',
  (path: readonly number[]) => `Invalid masterPath returned by HDStore: ${path}`,
);
