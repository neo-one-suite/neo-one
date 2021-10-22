import { BinaryWriter, ByteArrayContractParameterJSON, IOHelper, JSONHelper, utils } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class ByteArrayContractParameter extends ContractParameterBase<
  ByteArrayContractParameter,
  ByteArrayContractParameterJSON,
  ContractParameterType.ByteArray
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ByteArrayContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readVarBytesLE();

    return new this(value);
  }

  public readonly type = ContractParameterType.ByteArray;
  public readonly value: Buffer;
  private readonly sizeInternal: () => number;

  public constructor(value: Buffer) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfVarBytesLE(this.value));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return this.value;
  }

  public asInteger(): BN {
    return new BN(this.asBuffer(), 'le');
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(this.value);
  }

  public serializeJSON(): ByteArrayContractParameterJSON {
    return {
      type: 'ByteArray',
      value: JSONHelper.writeBase64Buffer(this.value),
    };
  }
}
