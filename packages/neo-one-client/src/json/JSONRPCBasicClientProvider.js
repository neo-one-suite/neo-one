/* @flow */
import type {
  BasicAccount,
  BasicBlock,
  BasicClientProvider,
  BasicInvocationResult,
  BasicTransaction,
} from '../types';
import JSONRPCBasicClientBaseProvider from './JSONRPCBasicClientBaseProvider';

export default class JSONRPCBasicClientProvider extends JSONRPCBasicClientBaseProvider<
  BasicBlock,
  BasicTransaction,
  BasicAccount,
  BasicInvocationResult,
> implements BasicClientProvider {}
