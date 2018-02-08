/* @flow */
import type BN from 'bn.js';
import {
  type ContractParameter,
  BinaryWriter,
  BooleanContractParameter,
  utils,
} from '@neo-one/client-core';

import { STACK_ITEM_TYPE } from './StackItemType';
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

  serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(STACK_ITEM_TYPE.BOOLEAN);
    writer.writeBoolean(this.value);
    return writer.toBuffer();
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
