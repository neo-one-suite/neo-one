/* @flow */
import {
  type ContractParameter,
  type UInt256,
  Hash256ContractParameter,
  common,
} from '@neo-one/client-core';

import StackItemBase from './StackItemBase';

export default class UInt256StackItem extends StackItemBase {
  value: UInt256;

  constructor(value: UInt256) {
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
      common.uInt256Equal(this.value, other.asUInt256())
    );
  }

  asUInt256(): UInt256 {
    return this.value;
  }

  asBuffer(): Buffer {
    return common.uInt256ToBuffer(this.value);
  }

  toContractParameter(): ContractParameter {
    return new Hash256ContractParameter(this.value);
  }
}
