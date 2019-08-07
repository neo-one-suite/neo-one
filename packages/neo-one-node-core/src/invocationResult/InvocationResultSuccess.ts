import { InvalidFormatError, InvocationResultSuccessJSON, JSONHelper, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter } from '../contractParameter';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { InvocationResultBase } from './InvocationResultBase';

export interface InvocationResultSuccessAdd {
  readonly gasConsumed: BN;
  readonly gasCost: BN;
  readonly stack: readonly ContractParameter[];
}

export class InvocationResultSuccess extends InvocationResultBase<VMState.Halt>
  implements SerializableJSON<InvocationResultSuccessJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): InvocationResultSuccess {
    const { state, gasConsumed, gasCost, stack } = super.deserializeInvocationResultWireBase(options);
    if (state !== VMState.Halt) {
      throw new InvalidFormatError(`Expected VMState state to be ${VMState.Halt}. Received: ${state}.`);
    }

    return new this({ gasConsumed, gasCost, stack });
  }

  public constructor({ gasConsumed, gasCost, stack }: InvocationResultSuccessAdd) {
    super({ state: VMState.Halt, gasConsumed, gasCost, stack });
  }

  public serializeJSON(context: SerializeJSONContext): InvocationResultSuccessJSON {
    return {
      state: VMState.Halt,
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      gas_cost: JSONHelper.writeFixed8(this.gasCost),
      stack: this.stack.map((value) => value.serializeJSON(context)),
    };
  }
}
