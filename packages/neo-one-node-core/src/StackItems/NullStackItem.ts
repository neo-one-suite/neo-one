import { isStackItemType, StackItemType } from '@neo-one/client-common';
import { AnyContractParameter, ContractParameter } from '../contractParameter';
import { InvalidStackItemCastError } from '../errors';
import { StackItemBase } from './StackItemBase';
import { StackItem } from './StackItems';

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

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new AnyContractParameter();
  }
}
