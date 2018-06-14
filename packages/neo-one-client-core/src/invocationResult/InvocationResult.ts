import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { assertVMState, VMState } from '../vm';
import { InvocationResultError, InvocationResultErrorJSON } from './InvocationResultError';
import { InvocationResultSuccess, InvocationResultSuccessJSON } from './InvocationResultSuccess';

export type InvocationResult = InvocationResultSuccess | InvocationResultError;
export type InvocationResultJSON = InvocationResultSuccessJSON | InvocationResultErrorJSON;

export const deserializeInvocationResultWireBase = (options: DeserializeWireBaseOptions): InvocationResult => {
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

export const deserializeInvocationResultWire = createDeserializeWire(deserializeInvocationResultWireBase);
