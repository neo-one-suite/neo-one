import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeTypeModel } from './AttributeTypeModel';

export class HighPriorityAttributeModel extends AttributeBaseModel {
  public readonly type = AttributeTypeModel.HighPriority;
  public readonly allowMultiple = false;
}
