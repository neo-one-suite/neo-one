import { Action } from './action';
import { InvocationResult } from './invocationResult';

export interface CallReceipt {
  readonly result: InvocationResult;
  readonly actions: readonly Action[];
}
