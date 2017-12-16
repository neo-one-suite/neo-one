/* @flow */
import { type ContractParameter, ArrayContractParameter } from '@neo-one/core';
import _ from 'lodash';

import { InvalidValueBufferError } from './errors';
import StackItemBase from './StackItemBase';
import type { StackItem } from './StackItem';

export default class ArrayLikeStackItem extends StackItemBase {
  value: Array<StackItem>;

  constructor(value: Array<StackItem>) {
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
      other instanceof this.constructor &&
      _.isEqualWith(
        this.value,
        (other: ArrayLikeStackItem).value,
        (a, b) => a === b || (a != null && b != null && a.equals(b)),
      )
    );
  }

  isArray(): boolean {
    return true;
  }

  asArray(): Array<StackItem> {
    return this.value;
  }

  asBoolean(): boolean {
    return this.value.length > 0;
  }

  // eslint-disable-next-line
  asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  toContractParameter(): ContractParameter {
    return new ArrayContractParameter(
      this.value.map(val => val.toContractParameter()),
    );
  }
}
