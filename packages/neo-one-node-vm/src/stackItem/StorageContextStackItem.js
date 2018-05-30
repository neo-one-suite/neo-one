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
  isReadOnly: boolean;

  constructor(value: UInt160, isReadOnly: boolean = false) {
    super();
    this.value = value;
    this.isReadOnly = isReadOnly;
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

  asReadOnly(): StorageContextStackItem {
    return new this.constructor(this.value, true);
  }

  toContractParameter(): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
