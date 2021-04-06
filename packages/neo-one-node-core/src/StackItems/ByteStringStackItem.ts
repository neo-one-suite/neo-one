import { StackItemType, utils } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ByteArrayContractParameter, ContractParameter } from '../contractParameter';
import { InvalidIntegerStackItemError } from '../errors';
import { IntegerStackItem } from './IntegerStackItem';
import { PrimitiveStackItemBase } from './PrimitiveStackItemBase';
import { StackItemBase } from './StackItemBase';
import { isByteStringStackItem, StackItem } from './StackItems';

const maxComparableSize = utils.USHORT_MAX_NUMBER;

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
    if (this.size > maxComparableSize) {
      throw new Error('The operand exceeds the maximum comparable size.');
    }

    if (!isByteStringStackItem(other)) {
      return false;
    }

    if (other.size > maxComparableSize) {
      throw new Error('The operand exceeds the maximum comparable size.');
    }

    return this.memory.equals(other.getBuffer());
  }

  public getBoolean() {
    if (this.size > IntegerStackItem.maxSize) {
      throw new Error('Invalid cast exception');
    }

    if (this.size === 0) {
      return false;
    }

    return this.memory.some((value) => value !== 0);
  }

  public getInteger() {
    if (this.size > IntegerStackItem.maxSize) {
      throw new InvalidIntegerStackItemError(this.size);
    }

    return new BN(this.getBuffer(), 'le');
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ByteArrayContractParameter(this.memory);
  }
}
