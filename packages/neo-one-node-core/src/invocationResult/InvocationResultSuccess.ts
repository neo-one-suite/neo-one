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

export class InvocationResultSuccess extends InvocationResultBase<VMState.HALT>
  implements SerializableJSON<InvocationResultSuccessJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): InvocationResultSuccess {
    const { state, gasConsumed, gasCost, stack } = super.deserializeInvocationResultWireBase(options);
    if (state !== VMState.HALT) {
      throw new InvalidFormatError(`Expected VMState state to be ${VMState.HALT}. Received: ${state}.`);
    }

    return new this({ gasConsumed, gasCost, stack });
  }

  public constructor({ gasConsumed, gasCost, stack }: InvocationResultSuccessAdd) {
    super({ state: VMState.HALT, gasConsumed, gasCost, stack });
  }

  public serializeJSON(context: SerializeJSONContext): InvocationResultSuccessJSON {
    return {
      state: VMState.HALT,
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      gas_cost: JSONHelper.writeFixed8(this.gasCost),
      stack: this.stack.map((value) => value.serializeJSON(context)),
    };
  }
}
