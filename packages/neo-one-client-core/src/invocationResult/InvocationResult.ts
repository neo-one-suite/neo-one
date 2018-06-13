import {
  createDeserializeWire,
  DeserializeWire,
  DeserializeWireBaseOptions,
} from '../Serializable';
import { assertVMState, VMState } from '../vm';
import { InvocationResultError } from './InvocationResultError';
import { InvocationResultErrorJSON } from './InvocationResultError';
import { InvocationResultSuccess } from './InvocationResultSuccess';
import { InvocationResultSuccessJSON } from './InvocationResultSuccess';

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
