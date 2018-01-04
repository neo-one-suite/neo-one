/* @flow */
export { default as InvocationResultSuccess } from './InvocationResultSuccess';
export { default as InvocationResultError } from './InvocationResultError';

export { deserializeWire, deserializeWireBase } from './InvocationResult';

export type {
  InvocationResult,
  InvocationResultJSON,
} from './InvocationResult';
export type { InvocationResultSuccessJSON } from './InvocationResultSuccess';
