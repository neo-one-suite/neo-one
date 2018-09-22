import { assertVMState, VMState } from '@neo-one/client-common';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { InvocationResultError } from './InvocationResultError';
import { InvocationResultSuccess } from './InvocationResultSuccess';

export type InvocationResult = InvocationResultSuccess | InvocationResultError;

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
