/* @flow */
import type BN from 'bn.js';

import { JSONHelper } from '../utils';
import type {
  DeserializeWireBaseOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import InvocationResultBase from './InvocationResultBase';
import { InvalidFormatError } from '../errors';
import {
  type ContractParameter,
  type ContractParameterJSON,
} from '../contractParameter';
import { type VMStateHalt, VM_STATE } from '../vm';

export type InvocationResultSuccessAdd = {|
  gasConsumed: BN,
  stack: Array<ContractParameter>,
|};

export type InvocationResultSuccessJSON = {|
  state: VMStateHalt,
  gas_consumed: string,
  stack: Array<ContractParameterJSON>,
|};

export default class InvocationResultSuccess extends InvocationResultBase
  implements SerializableJSON<InvocationResultSuccessJSON> {
  constructor({ gasConsumed, stack }: InvocationResultSuccessAdd) {
    super({ state: VM_STATE.HALT, gasConsumed, stack });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const {
      state,
      gasConsumed,
      stack,
    } = super.deserializeInvocationResultWireBase(options);
    if (state !== VM_STATE.HALT) {
      throw new InvalidFormatError();
    }
    return new this({ gasConsumed, stack });
  }

  serializeJSON(context: SerializeJSONContext): InvocationResultSuccessJSON {
    return {
      state: VM_STATE.HALT,
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      stack: this.stack.map(value => value.serializeJSON(context)),
    };
  }
}
