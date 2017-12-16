/* @flow */
import type BN from 'bn.js';
import {
  type ContractParameter,
  BooleanContractParameter,
  utils,
} from '@neo-one/core';

import StackItemBase from './StackItemBase';

export default class BooleanStackItem extends StackItemBase {
  static TRUE = Buffer.from([1]);
  static FALSE = Buffer.from([0]);

  value: boolean;

  constructor(value: boolean) {
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

    if (other instanceof BooleanStackItem) {
      return this.value === other.value;
    }

    return (
      other instanceof StackItemBase && this.asBuffer().equals(other.asBuffer())
    );
  }

  asBigInteger(): BN {
    return this.value ? utils.ONE : utils.ZERO;
  }

  asBoolean(): boolean {
    return this.value;
  }

  asBuffer(): Buffer {
    return this.value ? this.constructor.TRUE : this.constructor.FALSE;
  }

  toContractParameter(): ContractParameter {
    return new BooleanContractParameter(this.value);
  }
}
