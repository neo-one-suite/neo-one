import { ArrayLikeStackItem } from './ArrayLikeStackItem';
import { StackItemType } from './StackItemType';

export class StructStackItem extends ArrayLikeStackItem {
  public static readonly type = StackItemType.Struct;

  public clone(): StructStackItem {
    return new StructStackItem(this.value.map((value) => (value instanceof StructStackItem ? value.clone() : value)));
  }
}
