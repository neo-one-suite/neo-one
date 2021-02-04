import { StackItemType } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter, IntegerContractParameter } from '../contractParameter';
import { InvalidIntegerStackItemError } from '../errors';
import { PrimitiveStackItemBase } from './PrimitiveStackItemBase';
import { StackItemBase } from './StackItemBase';
import { isIntegerStackItem, StackItem } from './StackItems';

export class IntegerStackItem extends PrimitiveStackItemBase {
  public static readonly Zero = new IntegerStackItem(new BN(0));
  public static readonly maxSize = 32;

  private readonly value: BN;

  public constructor(value: BN) {
    const size = value.eqn(0) ? 0 : value.byteLength();
    super({
      memory: value.eqn(0) ? Buffer.from([]) : value.toBuffer('le'),
      type: StackItemType.Integer,
      isNull: false,
      size,
    });

    if (size > IntegerStackItem.maxSize) {
      throw new InvalidIntegerStackItemError(size);
    }

    this.value = value;
  }

  public equals(other: StackItem) {
    if (isIntegerStackItem(other)) {
      return this.value.eq(other.getInteger());
    }

    return false;
  }

  public getBoolean() {
    return !this.value.eqn(0);
  }

  public getInteger() {
    return this.value;
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new IntegerContractParameter(this.value);
  }
}
