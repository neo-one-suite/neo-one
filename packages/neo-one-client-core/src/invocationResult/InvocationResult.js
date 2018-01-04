/* @flow */
import { VM_STATE, InvalidVMStateError, assertVMState } from '../vm';
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';

import InvocationResultSuccess from './InvocationResultSuccess';
import InvocationResultError from './InvocationResultError';

import type { InvocationResultSuccessJSON } from './InvocationResultSuccess';
import type { InvocationResultErrorJSON } from './InvocationResultError';

export type InvocationResult = InvocationResultSuccess | InvocationResultError;
export type InvocationResultJSON =
  | InvocationResultSuccessJSON
  | InvocationResultErrorJSON;

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): InvocationResult => {
  const { reader } = options;
  const state = assertVMState(reader.clone().readUInt8());
  switch (state) {
    case VM_STATE.FAULT:
      return InvocationResultError.deserializeWireBase(options);
    case VM_STATE.HALT:
      return InvocationResultSuccess.deserializeWireBase(options);
    default:
      throw new InvalidVMStateError(state);
  }
};

export const deserializeWire: DeserializeWire<
  InvocationResult,
> = createDeserializeWire(deserializeWireBase);
