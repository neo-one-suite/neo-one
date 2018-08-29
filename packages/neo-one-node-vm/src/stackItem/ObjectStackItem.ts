import { ContractParameter, InteropInterfaceContractParameter } from '@neo-one/client-core';
import { InvalidValueBufferError, UnsupportedStackItemSerdeError } from './errors';
import { StackItemBase } from './StackItemBase';

export class ObjectStackItem<Value> extends StackItemBase {
  public readonly value: Value;

  public constructor(value: Value) {
    super();
    this.value = value;
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

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new InteropInterfaceContractParameter();
  }

  // tslint:disable-next-line no-any
  public toJSON(): any {
    return JSON.stringify(this.value);
  }
}
