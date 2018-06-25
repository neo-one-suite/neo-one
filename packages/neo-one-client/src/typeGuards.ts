import {
  ABIParameter,
  ABIReturn,
  Action,
  ActionRaw,
  ArrayContractParameter,
  BooleanABIParameter,
  BooleanABIReturn,
  BooleanContractParameter,
  ByteArrayABIParameter,
  ByteArrayABIReturn,
  ByteArrayContractParameter,
  ClaimTransaction,
  ConfirmedClaimTransaction,
  ConfirmedContractTransaction,
  ConfirmedEnrollmentTransaction,
  ConfirmedInvocationTransaction,
  ConfirmedIssueTransaction,
  ConfirmedMinerTransaction,
  ConfirmedPublishTransaction,
  ConfirmedRegisterTransaction,
  ConfirmedStateTransaction,
  ConfirmedTransaction,
  ContractParameter,
  ContractTransaction,
  EnrollmentTransaction,
  Event,
  Hash160ABIParameter,
  Hash160ABIReturn,
  Hash160ContractParameter,
  Hash256ABIParameter,
  Hash256ABIReturn,
  Hash256ContractParameter,
  IntegerABIParameter,
  IntegerABIReturn,
  IntegerContractParameter,
  InteropInterfaceABIParameter,
  InteropInterfaceABIReturn,
  InteropInterfaceContractParameter,
  InvocationResult,
  InvocationResultError,
  InvocationResultSuccess,
  InvocationTransaction,
  IssueTransaction,
  Log,
  LogRaw,
  MinerTransaction,
  NotificationRaw,
  PublicKeyABIParameter,
  PublicKeyABIReturn,
  PublicKeyContractParameter,
  PublishTransaction,
  RawInvocationResult,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RegisterTransaction,
  SignatureABIParameter,
  SignatureABIReturn,
  SignatureContractParameter,
  StateTransaction,
  StringABIParameter,
  StringABIReturn,
  StringContractParameter,
  Transaction,
  VoidABIParameter,
  VoidABIReturn,
  VoidContractParameter,
} from './types';

// Contract Parameters
export const isSignatureContractParameter = (parameter: ContractParameter): parameter is SignatureContractParameter =>
  parameter.type === 'Signature';
export const isBooleanContractParameter = (parameter: ContractParameter): parameter is BooleanContractParameter =>
  parameter.type === 'Boolean';
export const isIntegerContractParameter = (parameter: ContractParameter): parameter is IntegerContractParameter =>
  parameter.type === 'Integer';
export const isHash160ContractParameter = (parameter: ContractParameter): parameter is Hash160ContractParameter =>
  parameter.type === 'Hash160';
export const isHash256ContractParameter = (parameter: ContractParameter): parameter is Hash256ContractParameter =>
  parameter.type === 'Hash256';
export const isByteArrayContractParameter = (parameter: ContractParameter): parameter is ByteArrayContractParameter =>
  parameter.type === 'ByteArray';
export const isPublicKeyContractParameter = (parameter: ContractParameter): parameter is PublicKeyContractParameter =>
  parameter.type === 'PublicKey';
export const isStringContractParameter = (parameter: ContractParameter): parameter is StringContractParameter =>
  parameter.type === 'String';
export const isArrayContractParameter = (parameter: ContractParameter): parameter is ArrayContractParameter =>
  parameter.type === 'Array';
export const isInteropInterfaceContractParameter = (
  parameter: ContractParameter,
): parameter is InteropInterfaceContractParameter => parameter.type === 'InteropInterface';
export const isVoidContractParameter = (parameter: ContractParameter): parameter is VoidContractParameter =>
  parameter.type === 'Void';

// Raw Invocation Results
export const isRawInvocationResultSuccess = (result: RawInvocationResult): result is RawInvocationResultSuccess =>
  result.state === 'HALT';
export const isRawInvocationResultError = (result: RawInvocationResult): result is RawInvocationResultError =>
  result.state === 'FAULT';

// Transactions
export const isClaimTransaction = (transaction: Transaction): transaction is ClaimTransaction =>
  transaction.type === 'ClaimTransaction';
export const isContractTransaction = (transaction: Transaction): transaction is ContractTransaction =>
  transaction.type === 'ContractTransaction';
export const isEnrollmentTransaction = (transaction: Transaction): transaction is EnrollmentTransaction =>
  transaction.type === 'EnrollmentTransaction';
export const isMinerTransaction = (transaction: Transaction): transaction is MinerTransaction =>
  transaction.type === 'MinerTransaction';
export const isPublishTransaction = (transaction: Transaction): transaction is PublishTransaction =>
  transaction.type === 'PublishTransaction';
export const isRegisterTransaction = (transaction: Transaction): transaction is RegisterTransaction =>
  transaction.type === 'RegisterTransaction';
export const isIssueTransaction = (transaction: Transaction): transaction is IssueTransaction =>
  transaction.type === 'IssueTransaction';
export const isInvocationTransaction = (transaction: Transaction): transaction is InvocationTransaction =>
  transaction.type === 'InvocationTransaction';
export const isStateTransaction = (transaction: Transaction): transaction is StateTransaction =>
  transaction.type === 'StateTransaction';

// Confirmed Transactions
export const isConfirmedClaimTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedClaimTransaction => transaction.type === 'ClaimTransaction';
export const isConfirmedContractTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedContractTransaction => transaction.type === 'ContractTransaction';
export const isConfirmedEnrollmentTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedEnrollmentTransaction => transaction.type === 'EnrollmentTransaction';
export const isConfirmedMinerTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedMinerTransaction => transaction.type === 'MinerTransaction';
export const isConfirmedPublishTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedPublishTransaction => transaction.type === 'PublishTransaction';
export const isConfirmedRegisterTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedRegisterTransaction => transaction.type === 'RegisterTransaction';
export const isConfirmedIssueTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedIssueTransaction => transaction.type === 'IssueTransaction';
export const isConfirmedInvocationTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedInvocationTransaction => transaction.type === 'InvocationTransaction';
export const isConfirmedStateTransaction = (
  transaction: ConfirmedTransaction,
): transaction is ConfirmedStateTransaction => transaction.type === 'StateTransaction';

// Actions
export const isEvent = (action: Action): action is Event => action.type === 'Event';
export const isLog = (action: Action): action is Log => action.type === 'Log';
export const isLogRaw = (action: ActionRaw): action is LogRaw => action.type === 'Log';
export const isNotificationRaw = (action: ActionRaw): action is NotificationRaw => action.type === 'Notification';

// Invocation Results
export const isInvocationResultSuccess = <T>(result: InvocationResult<T>): result is InvocationResultSuccess<T> =>
  result.state === 'HALT';
export const isInvocationResultError = <T>(result: InvocationResult<T>): result is InvocationResultError =>
  result.state === 'FAULT';

// ABI Returns
export const isSignatureABIReturn = (parameter: ABIReturn): parameter is SignatureABIReturn =>
  parameter.type === 'Signature';
export const isBooleanABIReturn = (parameter: ABIReturn): parameter is BooleanABIReturn => parameter.type === 'Boolean';
export const isIntegerABIReturn = (parameter: ABIReturn): parameter is IntegerABIReturn => parameter.type === 'Integer';
export const isHash160ABIReturn = (parameter: ABIReturn): parameter is Hash160ABIReturn => parameter.type === 'Hash160';
export const isHash256ABIReturn = (parameter: ABIReturn): parameter is Hash256ABIReturn => parameter.type === 'Hash256';
export const isByteArrayABIReturn = (parameter: ABIReturn): parameter is ByteArrayABIReturn =>
  parameter.type === 'ByteArray';
export const isPublicKeyABIReturn = (parameter: ABIReturn): parameter is PublicKeyABIReturn =>
  parameter.type === 'PublicKey';
export const isStringABIReturn = (parameter: ABIReturn): parameter is StringABIReturn => parameter.type === 'String';
export const isInteropInterfaceABIReturn = (parameter: ABIReturn): parameter is InteropInterfaceABIReturn =>
  parameter.type === 'InteropInterface';
export const isVoidABIReturn = (parameter: ABIReturn): parameter is VoidABIReturn => parameter.type === 'Void';

// ABI Parameters
export const isSignatureABIParameter = (parameter: ABIParameter): parameter is SignatureABIParameter =>
  parameter.type === 'Signature';
export const isBooleanABIParameter = (parameter: ABIParameter): parameter is BooleanABIParameter =>
  parameter.type === 'Boolean';
export const isIntegerABIParameter = (parameter: ABIParameter): parameter is IntegerABIParameter =>
  parameter.type === 'Integer';
export const isHash160ABIParameter = (parameter: ABIParameter): parameter is Hash160ABIParameter =>
  parameter.type === 'Hash160';
export const isHash256ABIParameter = (parameter: ABIParameter): parameter is Hash256ABIParameter =>
  parameter.type === 'Hash256';
export const isByteArrayABIParameter = (parameter: ABIParameter): parameter is ByteArrayABIParameter =>
  parameter.type === 'ByteArray';
export const isPublicKeyABIParameter = (parameter: ABIParameter): parameter is PublicKeyABIParameter =>
  parameter.type === 'PublicKey';
export const isStringABIParameter = (parameter: ABIParameter): parameter is StringABIParameter =>
  parameter.type === 'String';
export const isInteropInterfaceABIParameter = (parameter: ABIParameter): parameter is InteropInterfaceABIParameter =>
  parameter.type === 'InteropInterface';
export const isVoidABIParameter = (parameter: ABIParameter): parameter is VoidABIParameter => parameter.type === 'Void';
