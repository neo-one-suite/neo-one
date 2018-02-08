/* @flow */
export {
  ATTRIBUTE_USAGE,
  InvalidAttributeUsageError,
  InvalidAttributeUsageJSONError,
  assertAttributeUsage,
  assertAttributeUsageJSON,
  toAttributeUsage,
  BufferAttribute,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
  deserializeWire as deserializeAttributeWire,
  deserializeWireBase as deserializeAttributeWireBase,
} from './attribute';
export {
  TRANSACTION_TYPE,
  InvalidTransactionTypeError,
  assertTransactionType,
} from './TransactionType';

export { default as MinerTransaction } from './MinerTransaction';
export { default as IssueTransaction } from './IssueTransaction';
export { default as ClaimTransaction } from './ClaimTransaction';
export { default as EnrollmentTransaction } from './EnrollmentTransaction';
export { default as RegisterTransaction } from './RegisterTransaction';
export { default as ContractTransaction } from './ContractTransaction';
export { default as PublishTransaction } from './PublishTransaction';
export { default as StateTransaction } from './StateTransaction';
export { default as InvocationTransaction } from './InvocationTransaction';
export { default as Input } from './Input';
export { default as Output } from './Output';

export type { MinerTransactionJSON } from './MinerTransaction';
export type { IssueTransactionJSON } from './IssueTransaction';
export type { ClaimTransactionJSON } from './ClaimTransaction';
export type { EnrollmentTransactionJSON } from './EnrollmentTransaction';
export type { RegisterTransactionJSON } from './RegisterTransaction';
export type { ContractTransactionJSON } from './ContractTransaction';
export type { PublishTransactionJSON } from './PublishTransaction';
export * from './StateTransaction';
export type {
  InvocationDataJSON,
  InvocationTransactionJSON,
} from './InvocationTransaction';
export type { InputJSON } from './Input';
export type { OutputJSON } from './Output';

export {
  deserializeWireBase as deserializeTransactionWireBase,
  deserializeWire as deserializeTransactionWire,
} from './Transaction';
export { MAX_TRANSACTION_ATTRIBUTES } from './TransactionBase';

export type {
  Attribute,
  AttributeJSON,
  AttributeUsage,
  AttributeUsageJSON,
} from './attribute';
export type { FeeContext } from './TransactionBase';
export type { OutputKey } from './Output';
export type {
  Transaction,
  TransactionJSON,
  TransactionReceiptJSON,
  TransactionKey,
} from './Transaction';
export type { TransactionType } from './TransactionType';
