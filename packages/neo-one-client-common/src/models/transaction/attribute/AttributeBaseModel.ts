import { BinaryWriter } from '../../../BinaryWriter';
import { IOHelper } from '../../../IOHelper';
import { createSerializeWire, SerializableWire, SerializeWire } from '../../Serializable';
import { AttributeTypeModel } from './AttributeTypeModel';

export abstract class AttributeBaseModel implements SerializableWire {
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

  public get size() {
    return IOHelper.sizeOfUInt8 + this.sizeExclusive();
  }

  protected sizeExclusive(): number {
    return 0;
  }
}
