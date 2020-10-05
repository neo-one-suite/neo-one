import { StackItemBase } from './StackItemBase';
import { StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

export class StructStackItem extends StackItemBase {
  public readonly array: readonly StackItem[];

  public constructor(array: readonly StackItem[]) {
    super({
      type: StackItemType.Struct,
      isNull: false,
    });

    this.array = array;
  }

  public getBoolean() {
    return true;
  }
}
