import { ContractParameter, Equatable, InteropInterfaceContractParameter } from '@neo-one/client-core';
import { InvalidValueBufferError, UnsupportedStackItemSerdeError } from './errors';
import { StackItemBase } from './StackItemBase';

export class ObjectStackItem<Value extends Equatable> extends StackItemBase {
  public readonly value: Value;

  public constructor(value: Value) {
    super();
    this.value = value;
  }

  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return other instanceof ObjectStackItem && this.value.equals(other.value);
  }

  public serialize(): Buffer {
    throw new UnsupportedStackItemSerdeError();
  }

  public asBoolean(): boolean {
    return this.value !== undefined;
  }

  public asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  public toContractParameter(): ContractParameter {
    return new InteropInterfaceContractParameter();
  }

  // tslint:disable-next-line no-any
  public toJSON(): any {
    return JSON.stringify(this.value);
  }
}
