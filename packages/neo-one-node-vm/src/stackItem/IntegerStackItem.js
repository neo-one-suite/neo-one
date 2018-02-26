/* @flow */
import type BN from 'bn.js';
import {
  type ContractParameter,
  BinaryWriter,
  IntegerContractParameter,
  utils,
} from '@neo-one/client-core';

import { STACK_ITEM_TYPE } from './StackItemType';
import { InvalidValueStorageContextStackItemError } from './errors';
import StackItemBase, {
  type AsStorageContextStackItemOptions,
} from './StackItemBase';
import StorageContextStackItem from './StorageContextStackItem';

export default class IntegerStackItem extends StackItemBase {
  value: BN;

  constructor(value: BN) {
    super();
    this.value = value;
  }

  equals(other: mixed): boolean {
    if (other == null) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (other instanceof IntegerStackItem) {
      return this.value.eq(other.value);
    }

    return (
      other instanceof StackItemBase && this.asBuffer().equals(other.asBuffer())
    );
  }

  serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(STACK_ITEM_TYPE.INTEGER);
    writer.writeVarBytesLE(utils.toSignedBuffer(this.value));
    return writer.toBuffer();
  }

  asBigInteger(): BN {
    return this.value;
  }

  asBoolean(): boolean {
    return !this.value.isZero();
  }

  asBuffer(): Buffer {
    return utils.toSignedBuffer(this.value);
  }

  // https://github.com/lllwvlvwlll/MegaCity.AntShares/tree/master/src/AntShares
  asStorageContextStackItem({
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
          break;
      }

      if (hash != null) {
        return new StorageContextStackItem(hash);
      }
    }
    throw new InvalidValueStorageContextStackItemError();
  }

  toContractParameter(): ContractParameter {
    return new IntegerContractParameter(this.value);
  }
}
