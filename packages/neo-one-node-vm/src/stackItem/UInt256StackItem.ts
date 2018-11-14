import { common, UInt256 } from '@neo-one/client-common';
import { ContractParameter, Hash256ContractParameter } from '@neo-one/node-core';
import { StackItemBase } from './StackItemBase';

export class UInt256StackItem extends StackItemBase {
  public readonly value: UInt256;

  public constructor(value: UInt256) {
    super();
    this.value = value;
  }

  public asUInt256(): UInt256 {
    return this.value;
  }

  public asBuffer(): Buffer {
    return common.uInt256ToBuffer(this.value);
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new Hash256ContractParameter(this.value);
  }
}
