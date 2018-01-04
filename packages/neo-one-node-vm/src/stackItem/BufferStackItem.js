/* @flow */
import {
  type ContractParameter,
  ByteArrayContractParameter,
} from '@neo-one/client-core';

import StackItemBase from './StackItemBase';

export default class BufferStackItem extends StackItemBase {
  value: Buffer;

  constructor(value: Buffer) {
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
      other instanceof StackItemBase && this.value.equals(other.asBuffer())
    );
  }

  asBuffer(): Buffer {
    return this.value;
  }

  toContractParameter(): ContractParameter {
    return new ByteArrayContractParameter(this.value);
  }
}
