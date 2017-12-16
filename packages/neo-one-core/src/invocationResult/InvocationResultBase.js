/* @flow */
import type BN from 'bn.js';

import type { InvocationResult } from './InvocationResult';
import { BinaryReader, type BinaryWriter } from '../utils';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../Serializable';
import {
  type ContractParameter,
  deserializeWireBase as deserializeContractParameterWireBase,
} from '../contractParameter';
import { type VMState, assertVMState } from '../vm';

export type InvocationResultBaseAdd = {|
  state: VMState,
  gasConsumed: BN,
  stack: Array<ContractParameter>,
|};

export default class InvocationResultBase
  implements SerializableWire<InvocationResult> {
  state: VMState;
  gasConsumed: BN;
  stack: Array<ContractParameter>;

  constructor({ state, gasConsumed, stack }: InvocationResultBaseAdd) {
    this.state = state;
    this.gasConsumed = gasConsumed;
    this.stack = stack;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.state);
    writer.writeFixed8(this.gasConsumed);
    writer.writeArray(this.stack, contractParameter =>
      contractParameter.serializeWireBase(writer),
    );
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  // eslint-disable-next-line
  static deserializeInvocationResultWireBase(
    options: DeserializeWireBaseOptions,
  ): {|
    state: VMState,
    gasConsumed: BN,
    stack: Array<ContractParameter>,
  |} {
    const { reader } = options;
    const state = reader.readUInt8();
    const gasConsumed = reader.readFixed8();
    const stack = reader.readArray(() =>
      deserializeContractParameterWireBase(options),
    );
    return {
      state: assertVMState(state),
      gasConsumed,
      stack,
    };
  }

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    throw new Error('Not Implemented');
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
