/* @flow */
import Client from './Client';

export { JSONRPCHTTPProvider } from './json';

export { default as BasicClient } from './BasicClient';
export { default as Client } from './Client';

export default new Client({ type: 'main' });

export const testClient = new Client({ type: 'test' });

export type {
  Action,
  ActionFilter,
  ActionType,
  Account,
  Asset,
  AssetName,
  AssetType,
  Attribute,
  Block,
  BlockFilter,
  ClaimTransaction,
  Contract,
  ContractTransaction,
  EnrollmentTransaction,
  GetActionsFilter,
  Header,
  Input,
  InvocationResult,
  IssueTransaction,
  InvocationTransaction,
  LogAction,
  MinerTransaction,
  NotificationAction,
  Output,
  PublishTransaction,
  RegisterTransaction,
  StorageItem,
  Transaction,
  Validator,
  Witness,
  ContractParameter,
  ContractParameterType,
  SignatureContractParameter,
  BooleanContractParameter,
  IntegerContractParameter,
  Hash160ContractParameter,
  Hash256ContractParameter,
  ByteArrayContractParameter,
  PublicKeyContractParameter,
  StringContractParameter,
  ArrayContractParameter,
  InteropInterfaceContractParameter,
  VoidContractParameter,
} from './types';
export type { JSONRPCProvider } from './json';
