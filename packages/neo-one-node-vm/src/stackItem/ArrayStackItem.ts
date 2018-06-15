import { ArrayLikeStackItem } from './ArrayLikeStackItem';
import { StackItemType } from './StackItemType';

export class ArrayStackItem extends ArrayLikeStackItem {
  public static readonly type = StackItemType.Array;
}
