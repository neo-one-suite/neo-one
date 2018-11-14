import {
  BinaryWriter,
  common,
  ECPoint,
  IOHelper,
  JSONHelper,
  PublicKeyContractParameterJSON,
  utils,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class PublicKeyContractParameter extends ContractParameterBase<
  PublicKeyContractParameter,
  PublicKeyContractParameterJSON,
  ContractParameterType.PublicKey
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PublicKeyContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readECPoint();

    return new this(value);
  }

  public readonly type = ContractParameterType.PublicKey;
  public readonly value: ECPoint;
  private readonly sizeInternal: () => number;

  public constructor(value: ECPoint) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfECPoint(this.value));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return common.ecPointToBuffer(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeECPoint(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): PublicKeyContractParameterJSON {
    return {
      type: 'PublicKey',
      value: JSONHelper.writeECPoint(this.value),
    };
  }
}
