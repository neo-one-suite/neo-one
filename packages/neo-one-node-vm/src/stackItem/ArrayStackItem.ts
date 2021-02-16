import { ArrayLikeStackItem } from './ArrayLikeStackItem';
import { getNextID } from './referenceCounter';
import { StackItemType } from './StackItemType';

export class ArrayStackItem extends ArrayLikeStackItem {
  public static readonly type = StackItemType.Array;
  private readonly referenceID = getNextID();

  public toStructuralKey(): string {
    return `${this.referenceID}`;
  }
  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    return this === other;
  }
}
