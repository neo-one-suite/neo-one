import { common, ContractParameter, Hash256ContractParameter, UInt256 } from '@neo-one/client-core';
import { StackItemBase } from './StackItemBase';

export class UInt256StackItem extends StackItemBase {
  public readonly value: UInt256;

  public constructor(value: UInt256) {
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
      const value = other.asUInt256Maybe();

      return value !== undefined && common.uInt256Equal(this.value, value);
    }

    return false;
  }

  public asUInt256(): UInt256 {
    return this.value;
  }

  public asBuffer(): Buffer {
    return common.uInt256ToBuffer(this.value);
  }

  public toContractParameter(): ContractParameter {
    return new Hash256ContractParameter(this.value);
  }
}
