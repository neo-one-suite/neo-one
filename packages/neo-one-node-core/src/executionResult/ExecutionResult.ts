import { assertVMState, VMState } from '@neo-one/client-common';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { ExecutionResultError } from './ExecutionResultError';
import { ExecutionResultSuccess } from './ExecutionResultSuccess';

export type ExecutionResult = ExecutionResultSuccess | ExecutionResultError;

export const deserializeExecutionResultWireBase = (options: DeserializeWireBaseOptions): ExecutionResult => {
  const { reader } = options;
  const state = assertVMState(reader.clone().readUInt8());
  switch (state) {
    case VMState.FAULT:
      return ExecutionResultError.deserializeWireBase(options);
    case VMState.HALT:
      return ExecutionResultSuccess.deserializeWireBase(options);
    default:
      throw new Error('Invalid VM state');
  }
};

export const deserializeExecutionResultWire = createDeserializeWire(deserializeExecutionResultWireBase);
