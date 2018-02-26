/* @flow */
import { type BinaryWriter, BinaryReader } from '../utils';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableWire,
  type SerializeWire,
  type SerializableJSON,
  type SerializeJSONContext,
  createSerializeWire,
} from '../Serializable';

import type { ContractParameterType } from './ContractParameterType';

export default class ContractParameterBase<
  T,
  TJSON,
  Type: ContractParameterType,
> implements SerializableWire<T>, SerializableJSON<TJSON> {
  type: Type;

  asBuffer(): Buffer {
    throw new Error('Unimplemented.');
  }

  asBoolean(): boolean {
    return this.asBuffer().some(value => value !== 0);
  }

  // TODO: Need to deal with circular references in arrays
  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeContractParameterBaseWireBase({
    reader,
  }: DeserializeWireBaseOptions) {
    const type = reader.readUInt8();
    return { type };
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

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): TJSON {
    throw new Error('Not Implemented');
  }
}
