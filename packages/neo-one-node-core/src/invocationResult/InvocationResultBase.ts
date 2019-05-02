import { assertVMState, BinaryWriter, IOHelper, utils, VMState } from '@neo-one/client-common';
import BN from 'bn.js';
import { ContractParameter, deserializeContractParameterWireBase } from '../contractParameter';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { BinaryReader } from '../utils';
import { InvocationResult } from './InvocationResult';

export interface InvocationResultBaseAdd<T extends VMState> {
  readonly state: T;
  readonly gasConsumed: BN;
  readonly gasCost: BN;
  readonly stack: readonly ContractParameter[];
}

export abstract class InvocationResultBase<T extends VMState = VMState> implements SerializableWire<InvocationResult> {
  public static deserializeInvocationResultWireBase(
    options: DeserializeWireBaseOptions,
  ): {
    readonly state: VMState;
    readonly gasConsumed: BN;
    readonly gasCost: BN;
    readonly stack: readonly ContractParameter[];
  } {
    const { reader } = options;
    const state = reader.readUInt8();
    const gasConsumed = reader.readFixed8();
    const gasCost = reader.readFixed8();
    const stack = reader.readArray(() => deserializeContractParameterWireBase(options));

    return {
      state: assertVMState(state),
      gasConsumed,
      gasCost,
      stack,
    };
  }

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): InvocationResultBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): InvocationResultBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly state: T;
  public readonly gasConsumed: BN;
  public readonly gasCost: BN;
  public readonly stack: readonly ContractParameter[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  protected readonly sizeExclusive: () => number;
  private readonly sizeInternal: () => number;

  public constructor({ state, gasConsumed, gasCost, stack }: InvocationResultBaseAdd<T>) {
    this.state = state;
    this.gasConsumed = gasConsumed;
    this.gasCost = gasCost;
    this.stack = stack;
    this.sizeExclusive = () => 0;
    this.sizeInternal = utils.lazy(
      () =>
        this.sizeExclusive() +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfArray(this.stack, (value) => value.size),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.state);
    writer.writeFixed8(this.gasConsumed);
    writer.writeFixed8(this.gasCost);
    writer.writeArray(this.stack, (contractParameter) => contractParameter.serializeWireBase(writer));
  }
}
