import { BinaryWriter, ContractParameter, IntegerContractParameter, utils } from '@neo-one/client-core';
import { BN } from 'bn.js';
import { InvalidValueStorageContextStackItemError } from './errors';
import { AsStorageContextStackItemOptions, StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';
import { StorageContextStackItem } from './StorageContextStackItem';

export class IntegerStackItem extends StackItemBase {
  public readonly value: BN;

  public constructor(value: BN) {
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

    if (other instanceof IntegerStackItem) {
      return this.value.eq(other.value);
    }

    if (other instanceof StackItemBase) {
      const value = other.asBufferMaybe();

      return value !== undefined && this.asBuffer().equals(value);
    }

    return false;
  }

  public serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Integer);
    writer.writeVarBytesLE(utils.toSignedBuffer(this.value));

    return writer.toBuffer();
  }

  public asBigInteger(): BN {
    return this.value;
  }

  public asBoolean(): boolean {
    return !this.value.isZero();
  }

  public asBuffer(): Buffer {
    return utils.toSignedBuffer(this.value);
  }

  // https://github.com/lllwvlvwlll/MegaCity.AntShares/tree/master/src/AntShares
  public asStorageContextStackItem({
    currentBlockIndex,
    vm,
    scriptHash,
    callingScriptHash,
    entryScriptHash,
  }: AsStorageContextStackItemOptions): StorageContextStackItem {
    if (currentBlockIndex <= vm.storageContext.v0.index) {
      const storageContext = this.asBigInteger().toNumber();
      let hash;
      switch (storageContext) {
        case 1:
          hash = scriptHash;
          break;
        case 2:
          hash = callingScriptHash;
          break;
        case 4:
          hash = entryScriptHash;
          break;
        default:
      }

      if (hash !== undefined) {
        return new StorageContextStackItem(hash);
      }
    }
    throw new InvalidValueStorageContextStackItemError();
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new IntegerContractParameter(this.value);
  }
}
