import { BinaryWriter } from '../../../BinaryWriter';
import { createSerializeWire, SerializableWire, SerializeWire } from '../../Serializable';
import { AttributeModel } from './AttributeModel';
import { AttributeTypeModel } from './AttributeTypeModel';

export abstract class AttributeBaseModel implements SerializableWire<AttributeModel> {
  public abstract readonly type: AttributeTypeModel;
  public abstract readonly allowMultiple: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    this.serializeWithoutTypeBase(writer);
  }

  protected serializeWithoutTypeBase(_writer: BinaryWriter): void {
    // do nothing
  }
}
