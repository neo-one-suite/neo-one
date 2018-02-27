/* @flow */
import {
  type Attribute,
  type ContractParameter,
  type ECPoint,
  type UInt160,
  type UInt256,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
} from '@neo-one/client-core';

import BufferStackItem from './BufferStackItem';
import ECPointStackItem from './ECPointStackItem';
import ObjectStackItem from './ObjectStackItem';
import type { StackItem } from './StackItem';
import UInt160StackItem from './UInt160StackItem';
import UInt256StackItem from './UInt256StackItem';

export default class AttributeStackItem extends ObjectStackItem<Attribute> {
  asAttribute(): Attribute {
    return this.value;
  }

  asUInt160(): UInt160 {
    return this.toValueStackItem().asUInt160();
  }

  asUInt256(): UInt256 {
    return this.toValueStackItem().asUInt256();
  }

  asECPoint(): ECPoint {
    return this.toValueStackItem().asECPoint();
  }

  asBuffer(): Buffer {
    return this.toValueStackItem().asBuffer();
  }

  toValueStackItem(): StackItem {
    const { value } = this;
    if (value instanceof ECPointAttribute) {
      return new ECPointStackItem(value.value);
    } else if (value instanceof UInt160Attribute) {
      return new UInt160StackItem(value.value);
    } else if (value instanceof UInt256Attribute) {
      return new UInt256StackItem(value.value);
    }

    return new BufferStackItem(value.value);
  }

  toContractParameter(): ContractParameter {
    return this.toValueStackItem().toContractParameter();
  }

  asAttributeStackItem(): AttributeStackItem {
    return this;
  }
}
