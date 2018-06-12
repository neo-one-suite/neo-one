import { BinaryWriter, BinaryReader } from '../utils';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
  SerializableJSON,
  SerializeJSONContext,
  createSerializeWire,
} from '../Serializable';
import { ContractParameterType } from './ContractParameterType';

export abstract class ContractParameterBase<
  T,
  TJSON,
  Type extends ContractParameterType
> implements SerializableWire<T>, SerializableJSON<TJSON> {
  public static deserializeContractParameterBaseWireBase({
    reader,
  }: DeserializeWireBaseOptions) {
    const type = reader.readUInt8();
    return { type };
  }

  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): ContractParameterBase<any, any, any> {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(
    options: DeserializeWireOptions,
  ): ContractParameterBase<any, any, any> {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public abstract readonly type: Type;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  public asBuffer(): Buffer {
    throw new Error('Unimplemented.');
  }

  public asBoolean(): boolean {
    return this.asBuffer().some((value) => value !== 0);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
  }

  public serializeJSON(context: SerializeJSONContext): TJSON {
    throw new Error('Not Implemented');
  }
}
