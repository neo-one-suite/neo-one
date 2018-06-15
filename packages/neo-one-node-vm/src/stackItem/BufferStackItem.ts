import { ByteArrayContractParameter, ContractParameter } from '@neo-one/client-core';
import { StackItemBase } from './StackItemBase';

export class BufferStackItem extends StackItemBase {
  public readonly value: Buffer;

  public constructor(value: Buffer) {
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

    if (other instanceof StackItemBase) {
      const value = other.asBufferMaybe();

      return value !== undefined && this.asBuffer().equals(value);
    }

    return false;
  }

  public asBuffer(): Buffer {
    return this.value;
  }

  public toContractParameter(): ContractParameter {
    return new ByteArrayContractParameter(this.value);
  }
}
