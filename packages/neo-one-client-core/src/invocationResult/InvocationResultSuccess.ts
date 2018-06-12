import BN from 'bn.js';
import { JSONHelper } from '../utils';
import {
  DeserializeWireBaseOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { InvocationResultBase } from './InvocationResultBase';
import { InvalidFormatError } from '../errors';
import { ContractParameter, ContractParameterJSON } from '../contractParameter';
import { VMState } from '../vm';

export interface InvocationResultSuccessAdd {
  gasConsumed: BN;
  gasCost: BN;
  stack: ContractParameter[];
}

export interface InvocationResultSuccessJSON {
  state: VMState.Halt;
  gas_consumed: string;
  gas_cost: string;
  stack: ContractParameterJSON[];
}

export class InvocationResultSuccess extends InvocationResultBase<VMState.Halt>
  implements SerializableJSON<InvocationResultSuccessJSON> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): InvocationResultSuccess {
    const {
      state,
      gasConsumed,
      gasCost,
      stack,
    } = super.deserializeInvocationResultWireBase(options);
    if (state !== VMState.Halt) {
      throw new InvalidFormatError();
    }
    return new this({ gasConsumed, gasCost, stack });
  }

  constructor({ gasConsumed, gasCost, stack }: InvocationResultSuccessAdd) {
    super({ state: VMState.Halt, gasConsumed, gasCost, stack });
  }

  public serializeJSON(
    context: SerializeJSONContext,
  ): InvocationResultSuccessJSON {
    return {
      state: VMState.Halt,
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      gas_cost: JSONHelper.writeFixed8(this.gasCost),
      stack: this.stack.map((value) => value.serializeJSON(context)),
    };
  }
}
