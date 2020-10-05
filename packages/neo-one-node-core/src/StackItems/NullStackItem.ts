import { InvalidStackItemCastError } from '../errors';
import { StackItemBase } from './StackItemBase';
import { StackItem } from './StackItems';
import { isStackItemType, StackItemType } from './StackItemType';

export class NullStackItem extends StackItemBase {
  public constructor() {
    super({
      type: StackItemType.Any,
      isNull: true,
    });
  }

  public convertTo(type: StackItemType) {
    if (type === StackItemType.Any || !isStackItemType(type)) {
      throw new InvalidStackItemCastError();
    }

    return this;
  }

  public equals(other: StackItem) {
    return other.isNull;
  }

  public getBoolean() {
    return false;
  }

  public getInterface<T>(): T | undefined {
    return undefined;
  }

  public getString() {
    return '';
  }
}
