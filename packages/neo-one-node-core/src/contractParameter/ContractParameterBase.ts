import { BinaryReader, BinaryWriter } from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { ContractParameterType } from './ContractParameterType';

export abstract class ContractParameterBase<
  // tslint:disable-next-line: no-unused
  T = {},
  TJSON = {},
  Type extends ContractParameterType = ContractParameterType,
> implements SerializableWire, SerializableJSON<TJSON>
{
  public static deserializeContractParameterBaseWireBase({ reader }: DeserializeWireBaseOptions) {
    const type = reader.readUInt8();

    return { type };
  }

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): ContractParameterBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractParameterBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
  public readonly isNull: boolean = false;

  public abstract readonly type: Type;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public asBuffer(): Buffer {
    throw new Error('Not Implemented');
  }

  public asInteger(): BN {
    throw new Error('Not Impleneted');
  }

  public asBoolean(): boolean {
    return this.asBuffer().some((value) => value !== 0);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
  }

  public serializeJSON(): TJSON {
    throw new Error('Not Implemented');
  }
}
