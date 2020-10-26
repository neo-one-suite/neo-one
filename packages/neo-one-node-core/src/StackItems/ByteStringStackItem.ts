import { BN } from 'bn.js';
import { InvalidIntegerStackItemError } from '../errors';
import { IntegerStackItem } from './IntegerStackItem';
import { PrimitiveStackItemBase } from './PrimitiveStackItemBase';
import { isByteStringStackItem, StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

export class ByteStringStackItem extends PrimitiveStackItemBase {
  public static readonly empty = new ByteStringStackItem(Buffer.from([]));

  public constructor(value: Buffer) {
    super({
      type: StackItemType.ByteString,
      memory: value,
      isNull: false,
    });
  }

  public equals(other: StackItem): boolean {
    if (isByteStringStackItem(other)) {
      return this.memory.equals(other.getBuffer());
    }

    return false;
  }

  public getBoolean() {
    if (this.size > IntegerStackItem.maxSize) {
      return true;
    }

    // TODO: verify, their implementation of this is awful to figure out
    return this.memory.some((value) => value !== 0);
  }

  public getInteger() {
    if (this.size > IntegerStackItem.maxSize) {
      throw new InvalidIntegerStackItemError(this.size);
    }

    return new BN(this.getBuffer(), 'le');
  }
}
