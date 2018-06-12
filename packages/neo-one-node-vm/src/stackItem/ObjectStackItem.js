/* @flow */
import {
  type ContractParameter,
  type Equatable,
  InteropInterfaceContractParameter,
} from '@neo-one/client-core';
import {
  InvalidValueBufferError,
  UnsupportedStackItemSerdeError,
} from './errors';
import StackItemBase from './StackItemBase';

export default class ObjectStackItem<Value: Equatable> extends StackItemBase {
  value: Value;

  constructor(value: Value) {
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

    return other instanceof ObjectStackItem && this.value.equals(other.value);
  }

  serialize(): Buffer {
    throw new UnsupportedStackItemSerdeError();
  }

  asBoolean(): boolean {
    return this.value != null;
  }

  asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  // eslint-disable-next-line
  toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new InteropInterfaceContractParameter();
  }

  toJSON(): any {
    return JSON.stringify(this.value);
  }
}
