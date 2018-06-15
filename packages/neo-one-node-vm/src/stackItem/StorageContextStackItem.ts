import { common, ContractParameter, Hash160ContractParameter, UInt160 } from '@neo-one/client-core';
import { AsStorageContextStackItemOptions, StackItemBase } from './StackItemBase';

export class StorageContextStackItem extends StackItemBase {
  public readonly value: UInt160;
  public readonly isReadOnly: boolean;

  public constructor(value: UInt160, isReadOnly = false) {
    super();
    this.value = value;
    this.isReadOnly = isReadOnly;
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

  public asBoolean(): boolean {
    return (this.value as UInt160 | undefined) !== undefined;
  }

  public asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  public asStorageContextStackItem(_options: AsStorageContextStackItemOptions): StorageContextStackItem {
    return this;
  }

  public asReadOnly(): StorageContextStackItem {
    return new StorageContextStackItem(this.value, true);
  }

  public toContractParameter(): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
