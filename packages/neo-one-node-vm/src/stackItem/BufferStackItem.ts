import { ByteArrayContractParameter, ContractParameter } from '@neo-one/client-core';
import { StackItemBase } from './StackItemBase';

export class BufferStackItem extends StackItemBase {
  public readonly value: Buffer;

  public constructor(value: Buffer) {
    super();
    this.value = value;
  }

  public asBuffer(): Buffer {
    return this.value;
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ByteArrayContractParameter(this.value);
  }
}
