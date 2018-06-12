import { VMState, assertVMState } from '../vm';
import {
  DeserializeWire,
  DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';
import { InvocationResultSuccess } from './InvocationResultSuccess';
import { InvocationResultError } from './InvocationResultError';
import { InvocationResultSuccessJSON } from './InvocationResultSuccess';
import { InvocationResultErrorJSON } from './InvocationResultError';

export type InvocationResult = InvocationResultSuccess | InvocationResultError;
export type InvocationResultJSON =
  | InvocationResultSuccessJSON
  | InvocationResultErrorJSON;

export const deserializeInvocationResultWireBase = (
  options: DeserializeWireBaseOptions,
): InvocationResult => {
  const { reader } = options;
  const state = assertVMState(reader.clone().readUInt8());
  switch (state) {
    case VMState.Fault:
      return InvocationResultError.deserializeWireBase(options);
    case VMState.Halt:
      return InvocationResultSuccess.deserializeWireBase(options);
    default:
      throw new Error('Invalid VM state');
  }
};

export const deserializeInvocationResultWire: DeserializeWire<
  InvocationResult
> = createDeserializeWire(deserializeInvocationResultWireBase);
