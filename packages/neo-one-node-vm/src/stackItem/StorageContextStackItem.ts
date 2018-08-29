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

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new Hash160ContractParameter(this.value);
  }
}
