import { BinaryWriter } from '../../../BinaryWriter';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeTypeModel } from './AttributeTypeModel';

export interface HighPriorityAttributeModelAdd {}

export class HighPriorityAttributeModel extends AttributeBaseModel {
  public readonly type: AttributeTypeModel;
  public readonly allowMultiple: boolean;

  public constructor({}: HighPriorityAttributeModelAdd) {
    super();
    this.type = AttributeTypeModel.HighPriority;
    this.allowMultiple = false;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    this.serializeWithoutTypeBase(writer);
  }

  // TODO: fill in
  public verify(): boolean {
    return true;
  }

  // TODO: check
  protected serializeWithoutTypeBase(_writer: BinaryWriter): void {
    // do nothing
  }
}
