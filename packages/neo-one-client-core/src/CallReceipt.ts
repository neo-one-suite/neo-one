import { Action, ActionJSON } from './action';
import { InvocationResult, InvocationResultJSON } from './invocationResult';

export interface CallReceipt {
  readonly result: InvocationResult;
  readonly actions: ReadonlyArray<Action>;
}

export interface CallReceiptJSON {
  readonly result: InvocationResultJSON;
  readonly actions: ReadonlyArray<ActionJSON>;
}
