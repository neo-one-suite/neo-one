/* @flow */
import {
  type ContractParameter,
  type UInt160,
  Hash160ContractParameter,
  common,
} from '@neo-one/client-core';

import StackItemBase from './StackItemBase';

export default class UInt160StackItem extends StackItemBase {
  value: UInt160;

  constructor(value: UInt160) {
    super();
    this.value = value;
  }

  equals(other: mixed): boolean {
    if (other == null) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (other instanceof StackItemBase) {
      const value = other.asUInt160Maybe();
      return value != null && common.uInt160Equal(this.asUInt160(), value);
    }

    return false;
  }

  asUInt160(): UInt160 {
    return this.value;
  }

  asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  // eslint-disable-next-line
  toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
