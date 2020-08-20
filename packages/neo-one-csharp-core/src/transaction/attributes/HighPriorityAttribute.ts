import { AttributeTypeModel } from '@neo-one/client-common';
import { AttributeBase } from './AttributeBase';

export class HighPriorityAttribute extends AttributeBase {
  public readonly type = AttributeTypeModel.HighPriority;
  public readonly allowMultiple = false;
}
