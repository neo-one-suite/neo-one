import { ExecutionResultSuccessJSON, InvalidFormatError, JSONHelper, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter } from '../contractParameter';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { ExecutionResultBase } from './ExecutionResultBase';

export interface ExecutionResultSuccessAdd {
  readonly gasConsumed: BN;
  readonly stack: readonly ContractParameter[];
}

export class ExecutionResultSuccess
  extends ExecutionResultBase<VMState.HALT>
  implements SerializableJSON<ExecutionResultSuccessJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ExecutionResultSuccess {
    const { state, gasConsumed, stack } = super.deserializeExecutionResultWireBase(options);
    if (state !== VMState.HALT) {
      throw new InvalidFormatError(`Expected VMState state to be ${VMState.HALT}. Received: ${state}.`);
    }

    return new this({ gasConsumed, stack });
  }

  public constructor({ gasConsumed, stack }: ExecutionResultSuccessAdd) {
    super({ state: VMState.HALT, gasConsumed, stack });
  }

  public serializeJSON(): ExecutionResultSuccessJSON {
    return {
      state: 'HALT',
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      stack: this.stack.map((value) => value.serializeJSON()),
    };
  }
}
