import { StackItemAdd, StackItemBase } from './StackItemBase';
import { StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

export interface ArrayStackItemAdd extends StackItemAdd {
  readonly array: readonly StackItem[];
}

export class ArrayStackItem extends StackItemBase {
  public readonly array: readonly StackItem[];

  public constructor(array: readonly StackItem[]) {
    super({
      type: StackItemType.Array,
      isNull: false,
    });

    this.array = array;
  }

  public get count() {
    return this.array.length;
  }

  public getBoolean() {
    return true;
  }
}
