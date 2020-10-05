import { StackItemBase } from './StackItemBase';
import { PrimitiveStackItem, StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

export class MapStackItem extends StackItemBase {
  public static readonly maxKeySize = 64;

  public readonly dictionary: Map<PrimitiveStackItem, StackItem>;

  public constructor(dictionary: Map<PrimitiveStackItem, StackItem>) {
    super({
      type: StackItemType.Map,
      isNull: false,
    });

    this.dictionary = dictionary;
  }

  public get count() {
    return this.dictionary.size;
  }

  public get subItemCount() {
    return this.count * 2;
  }

  public containsKey(key: PrimitiveStackItem) {
    return this.dictionary.has(key);
  }

  public tryGetValue(key: PrimitiveStackItem) {
    return this.dictionary.get(key);
  }

  public getBoolean() {
    return true;
  }
}
