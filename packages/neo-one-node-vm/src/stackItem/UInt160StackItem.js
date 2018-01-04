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

    return (
      other instanceof StackItemBase &&
      common.uInt160Equal(this.value, other.asUInt160())
    );
  }

  asUInt160(): UInt160 {
    return this.value;
  }

  asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  toContractParameter(): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
