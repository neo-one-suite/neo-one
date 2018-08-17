import { RawAction } from '@neo-one/client-core';
import { ProcessErrorError, ProcessErrorTrace } from '../common';

export const extractErrorTrace = (
  _actions: ReadonlyArray<RawAction>,
): {
  readonly error?: ProcessErrorError;
  readonly trace: ReadonlyArray<ProcessErrorTrace>;
} => ({ error: undefined, trace: [] });
