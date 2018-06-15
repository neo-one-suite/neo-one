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

    if (other instanceof StackItemBase) {
      const value = other.asBufferMaybe();
      return value != null && this.asBuffer().equals(value);
    }

    return false;
  }

  asBuffer(): Buffer {
    return this.value;
  }

  // eslint-disable-next-line
  toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ByteArrayContractParameter(this.value);
  }
}
