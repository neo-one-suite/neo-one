/* @flow */
import {
  type ContractParameter,
  type UInt160,
  Hash160ContractParameter,
  common,
} from '@neo-one/client-core';

import StackItemBase, {
  type AsStorageContextStackItemOptions,
} from './StackItemBase';

export default class StorageContextStackItem extends StackItemBase {
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
      other instanceof StorageContextStackItem &&
      common.uInt160Equal(this.asUInt160(), other.asUInt160())
    );
  }

  asUInt160(): UInt160 {
    return this.value;
  }

  asBoolean(): boolean {
    return this.value != null;
  }

  asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  asStorageContextStackItem(
    // eslint-disable-next-line
    options: AsStorageContextStackItemOptions,
  ): StorageContextStackItem {
    return this;
  }

  toContractParameter(): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
