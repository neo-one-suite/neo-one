import { HighPriorityAttributeJSON } from '../../../models/types';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeTypeModel } from './AttributeTypeModel';

export class HighPriorityAttributeModel extends AttributeBaseModel {
  public readonly type = AttributeTypeModel.HighPriority;
  public readonly allowMultiple = false;

  public serializeJSON(): HighPriorityAttributeJSON {
    return {
      type: 'HighPriority',
    };
  }
}
