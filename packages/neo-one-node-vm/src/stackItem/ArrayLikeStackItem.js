/* @flow */
import {
  type ContractParameter,
  ArrayContractParameter,
  BinaryWriter,
} from '@neo-one/client-core';

import { InvalidValueBufferError } from './errors';
import StackItemBase from './StackItemBase';
import type { StackItem } from './StackItem';
import type { StackItemType } from './StackItemType';

export default class ArrayLikeStackItem extends StackItemBase {
  static type: StackItemType;

  value: Array<StackItem>;

  constructor(value: Array<StackItem>) {
    super();
    this.value = value;
  }

  equals(other: mixed): boolean {
    if (other == null) {
      return false;
    }

    return this === other;
  }

  serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(this.constructor.type);
    writer.writeVarUIntLE(this.value.length);
    for (const item of this.value) {
      writer.writeBytes(item.serialize());
    }

    return writer.toBuffer();
  }

  isArray(): boolean {
    return true;
  }

  asArray(): Array<StackItem> {
    return this.value;
  }

  asBoolean(): boolean {
    return true;
  }

  asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  toContractParameter(): ContractParameter {
    return new ArrayContractParameter(
      this.value.map(val => val.toContractParameter()),
    );
  }

  get size(): number {
    return this.value.length;
  }
}
