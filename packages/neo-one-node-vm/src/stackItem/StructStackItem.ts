import { utils } from '@neo-one/utils';
import { ArrayLikeStackItem } from './ArrayLikeStackItem';
import { StackItemType } from './StackItemType';

export class StructStackItem extends ArrayLikeStackItem {
  public static readonly type = StackItemType.Struct;

  public clone(): StructStackItem {
    return new StructStackItem(this.value.map((value) => (value instanceof StructStackItem ? value.clone() : value)));
  }

  public toStructuralKey(): string {
    return JSON.stringify(this.value.map((value) => value.toStructuralKey()));
  }

  // NOTE: We don't use `toReferenceKey` for comparison here because it doesn't short-circuit
  // Instead, use equals for efficiency and since it's equivalent
  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (other instanceof StructStackItem) {
      if (this.value.length !== other.value.length) {
        return false;
      }

      return utils.zip(this.value, other.value).every(([a, b]) => a.equals(b));
    }

    return this === other;
  }
}
