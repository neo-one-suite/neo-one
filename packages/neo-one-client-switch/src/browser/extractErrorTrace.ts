import { ActionRaw } from '@neo-one/client-core';
import { ProcessErrorError, ProcessErrorTrace } from '../common';

export const extractErrorTrace = (
  _actions: ReadonlyArray<ActionRaw>,
): {
  readonly error?: ProcessErrorError;
  readonly trace: ReadonlyArray<ProcessErrorTrace>;
} => ({ error: undefined, trace: [] });
