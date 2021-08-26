import {
  BinaryWriter,
  ExecutionResultErrorJSON,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  utils,
  VMState,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter } from '../contractParameter';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { ExecutionResultBase } from './ExecutionResultBase';

export interface ExecutionResultErrorAdd {
  readonly gasConsumed: BN;
  readonly stack: readonly ContractParameter[];
  readonly message: string;
}

const MAX_SIZE = 1024;

export class ExecutionResultError
  extends ExecutionResultBase<VMState.FAULT>
  implements SerializableJSON<ExecutionResultErrorJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ExecutionResultError {
    const { reader } = options;
    const { state, gasConsumed, stack } = super.deserializeExecutionResultWireBase(options);
    if (state !== VMState.FAULT) {
      throw new InvalidFormatError(`Expected VMState to be: ${VMState.FAULT}. Received: ${state}`);
    }
    const message = reader.readVarString(MAX_SIZE);

    return new this({ gasConsumed, stack, message });
  }

  public readonly message: string;
  protected readonly sizeExclusive: () => number;

  public constructor({ gasConsumed, stack, message }: ExecutionResultErrorAdd) {
    super({ state: VMState.FAULT, gasConsumed, stack });
    this.message = message;
    this.sizeExclusive = utils.lazy(() => IOHelper.sizeOfVarString(this.message));
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.message, MAX_SIZE);
  }

  public serializeJSON(): ExecutionResultErrorJSON {
    return {
      state: 'FAULT',
      gas_consumed: JSONHelper.writeFixed8(this.gasConsumed),
      stack: this.stack.map((value) => value.serializeJSON()),
      message: this.message,
    };
  }
}
