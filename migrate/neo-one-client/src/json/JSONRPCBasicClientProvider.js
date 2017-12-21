/* @flow */
import type {
  Account,
  Block,
  BasicClientProvider,
  InvocationResult,
  Transaction,
} from '../types';
import JSONRPCBasicClientBaseProvider from './JSONRPCBasicClientBaseProvider';

export default class JSONRPCBasicClientProvider extends JSONRPCBasicClientBaseProvider<
  Block,
  Transaction,
  Account,
  InvocationResult,
> implements BasicClientProvider {}
