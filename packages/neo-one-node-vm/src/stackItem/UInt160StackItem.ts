import { common, ContractParameter, Hash160ContractParameter, UInt160 } from '@neo-one/client-core';
import { StackItemBase } from './StackItemBase';

export class UInt160StackItem extends StackItemBase {
  public readonly value: UInt160;

  public constructor(value: UInt160) {
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
      const value = other.asUInt160Maybe();

      return value !== undefined && common.uInt160Equal(this.asUInt160(), value);
    }

    return false;
  }

  public asUInt160(): UInt160 {
    return this.value;
  }

  public asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
