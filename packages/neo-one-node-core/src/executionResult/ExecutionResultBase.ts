import { assertVMState, BinaryReader, BinaryWriter, IOHelper, utils, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter, deserializeContractParameterWireBase } from '../contractParameter';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';

export interface ExecutionResultBaseAdd<T extends VMState> {
  readonly state: T;
  readonly gasConsumed: BN;
  readonly stack: readonly ContractParameter[];
}

export abstract class ExecutionResultBase<T extends VMState = VMState> implements SerializableWire {
  public static deserializeExecutionResultWireBase(options: DeserializeWireBaseOptions): {
    readonly state: VMState;
    readonly gasConsumed: BN;
    readonly stack: readonly ContractParameter[];
  } {
    const { reader } = options;
    const state = reader.readUInt8();
    const gasConsumed = reader.readFixed8();
    const stack = reader.readArray(() => deserializeContractParameterWireBase(options));

    return {
      state: assertVMState(state),
      gasConsumed,
      stack,
    };
  }

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): ExecutionResultBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): ExecutionResultBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly state: T;
  public readonly gasConsumed: BN;
  public readonly stack: readonly ContractParameter[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  protected readonly sizeExclusive: () => number;
  private readonly sizeInternal: () => number;

  public constructor({ state, gasConsumed, stack }: ExecutionResultBaseAdd<T>) {
    this.state = state;
    this.gasConsumed = gasConsumed;
    this.stack = stack;
    this.sizeExclusive = () => 0;
    this.sizeInternal = utils.lazy(
      () =>
        this.sizeExclusive() +
        IOHelper.sizeOfUInt8 +
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
    writer.writeArray(this.stack, (contractParameter) => contractParameter.serializeWireBase(writer));
  }
}
