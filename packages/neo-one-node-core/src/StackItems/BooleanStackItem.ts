import { BN } from 'bn.js';
import { PrimitiveStackItemBase } from './PrimitiveStackItemBase';
import { isBooleanStackItem, StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

export class BooleanStackItem extends PrimitiveStackItemBase {
  private static readonly TRUE = Buffer.from([0x01]);
  private static readonly FALSE = Buffer.from([0x00]);
  private readonly value: boolean;

  public constructor(value: boolean) {
    super({
      type: StackItemType.Boolean,
      isNull: false,
      memory: value ? BooleanStackItem.TRUE : BooleanStackItem.FALSE,
    });

    this.value = value;
  }

  public equals(other: StackItem) {
    if (isBooleanStackItem(other)) {
      return this.value === other.getBoolean();
    }

    return false;
  }

  public getBoolean() {
    return this.value;
  }

  public getInteger() {
    return this.value ? new BN(1) : new BN(0);
  }
}
