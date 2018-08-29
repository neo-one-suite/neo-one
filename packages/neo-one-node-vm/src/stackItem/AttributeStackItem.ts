import {
  Attribute,
  ContractParameter,
  ECPoint,
  ECPointAttribute,
  UInt160,
  UInt160Attribute,
  UInt256,
  UInt256Attribute,
} from '@neo-one/client-core';
import { BufferStackItem } from './BufferStackItem';
import { ECPointStackItem } from './ECPointStackItem';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';
import { StackItem } from './StackItem';
import { StackItemBase } from './StackItemBase';
import { UInt160StackItem } from './UInt160StackItem';
import { UInt256StackItem } from './UInt256StackItem';

export class AttributeStackItem extends EquatableKeyStackItem<Attribute> {
  public asAttribute(): Attribute {
    return this.value;
  }

  public asUInt160(): UInt160 {
    return this.toValueStackItem().asUInt160();
  }

  public asUInt256(): UInt256 {
    return this.toValueStackItem().asUInt256();
  }

  public asECPoint(): ECPoint {
    return this.toValueStackItem().asECPoint();
  }

  public asBuffer(): Buffer {
    return this.toValueStackItem().asBuffer();
  }

  public toValueStackItem(): StackItem {
    const { value } = this;
    if (value instanceof ECPointAttribute) {
      return new ECPointStackItem(value.value);
    }

    if (value instanceof UInt160Attribute) {
      return new UInt160StackItem(value.value);
    }

    if (value instanceof UInt256Attribute) {
      return new UInt256StackItem(value.value);
    }

    return new BufferStackItem(value.value);
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return this.toValueStackItem().toContractParameter();
  }

  public asAttributeStackItem(): AttributeStackItem {
    return this;
  }
}
