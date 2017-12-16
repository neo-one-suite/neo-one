/* @flow */
import type BN from 'bn.js';

import { type BinaryWriter, JSONHelper } from '../utils';
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
import { type VMStateFault, VM_STATE } from '../vm';

export type InvocationResultErrorAdd = {|
  gasConsumed: BN,
  stack: Array<ContractParameter>,
  message: string,
|};

export type BasicInvocationResultErrorJSON = {|
  state: VMStateFault,
  gas_consumed: string,
  stack: Array<ContractParameterJSON>,
|};

export type InvocationResultErrorJSON = {|
  ...BasicInvocationResultErrorJSON,
  message: string,
|};

const MAX_SIZE = 1024;

export default class InvocationResultError extends InvocationResultBase
  implements SerializableJSON<InvocationResultErrorJSON> {
  message: string;

  constructor({ gasConsumed, stack, message }: InvocationResultErrorAdd) {
    super({ state: VM_STATE.FAULT, gasConsumed, stack });
    this.message = message;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.message, MAX_SIZE);
  }

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const {
      state,
      gasConsumed,
      stack,
    } = super.deserializeInvocationResultWireBase(options);
    if (state !== VM_STATE.FAULT) {
      throw new InvalidFormatError();
    }
    const message = reader.readVarString(MAX_SIZE);
    return new this({ gasConsumed, stack, message });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): InvocationResultErrorJSON {
    return {
      state: VM_STATE.FAULT,
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      stack: this.stack.map(value => value.serializeJSON(context)),
      message: this.message,
    };
  }
}
