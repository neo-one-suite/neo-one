/* @flow */
import {
  type Account,
  type Asset,
  type Attribute,
  type Block,
  type BlockBase,
  type Contract,
  type ContractParameter,
  type ECPoint,
  type Equatable,
  type Input,
  type Output,
  type Transaction,
  type UInt160,
  type UInt256,
  type Validator,
  type VMSettings,
  BinaryWriter,
  common,
  utils,
} from '@neo-one/client-core';
import type BN from 'bn.js';

import { STACK_ITEM_TYPE } from './StackItemType';
import type AttributeStackItem from './AttributeStackItem';
import {
  InvalidValueArrayError,
  InvalidValueHeaderError,
  InvalidValueBlockError,
  InvalidValueBlockBaseError,
  InvalidValueEnumeratorError,
  InvalidValueTransactionError,
  InvalidValueAttributeError,
  InvalidValueAttributeStackItemError,
  InvalidValueInputError,
  InvalidValueOutputError,
  InvalidValueAccountError,
  InvalidValueAssetError,
  InvalidValueContractError,
  InvalidValueValidatorError,
  InvalidValueMapStackItemError,
  InvalidValueIteratorError,
  InvalidValueStorageContextStackItemError,
} from './errors';
import type MapStackItem from './MapStackItem';
import type { StackItem } from './StackItem';
import type StackItemEnumerator from './StackItemEnumerator';
import type StackItemIterator from './StackItemIterator';
import type StorageContextStackItem from './StorageContextStackItem';

export type AsStorageContextStackItemOptions = {|
  currentBlockIndex: number,
  vm: VMSettings,
  scriptHash: UInt160,
  callingScriptHash: ?UInt160,
  entryScriptHash: UInt160,
|};

export default class StackItemBase implements Equatable {
  equals(other: mixed): boolean {
    return this === other;
  }

  serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY);
    writer.writeVarBytesLE(this.asBuffer());
    return writer.toBuffer();
  }

  asArray(): Array<StackItem> {
    throw new InvalidValueArrayError();
  }

  asBigInteger(): BN {
    return utils.fromSignedBuffer(this.asBuffer());
  }

  asBuffer(): Buffer {
    throw new Error('Unimplemented.');
  }

  asBufferMaybe(): ?Buffer {
    try {
      return this.asBuffer();
    } catch (error) {
      return null;
    }
  }

  asBoolean(): boolean {
    return this.asBuffer().some((value) => value !== 0);
  }

  asUInt160(): UInt160 {
    return common.bufferToUInt160(this.asBuffer());
  }

  asUInt160Maybe(): ?UInt160 {
    try {
      return this.asUInt160();
    } catch (error) {
      return null;
    }
  }

  asUInt256(): UInt256 {
    return common.bufferToUInt256(this.asBuffer());
  }

  asUInt256Maybe(): ?UInt256 {
    try {
      return this.asUInt256();
    } catch (error) {
      return null;
    }
  }

  asECPoint(): ECPoint {
    const buffer = this.asBuffer();
    return buffer.length === 0
      ? common.ECPOINT_INFINITY
      : common.bufferToECPoint(buffer);
  }

  asECPointMaybe(): ?ECPoint {
    try {
      return this.asECPoint();
    } catch (error) {
      return null;
    }
  }

  asString(): string {
    return utils.toUTF8(this.asBuffer());
  }

  asHeader(): BlockBase {
    throw new InvalidValueHeaderError();
  }

  asBlockBase(): BlockBase {
    throw new InvalidValueBlockBaseError();
  }

  asBlock(): Block {
    throw new InvalidValueBlockError();
  }

  asTransaction(): Transaction {
    throw new InvalidValueTransactionError();
  }

  asAttribute(): Attribute {
    throw new InvalidValueAttributeError();
  }

  asAttributeStackItem(): AttributeStackItem {
    throw new InvalidValueAttributeStackItemError();
  }

  asInput(): Input {
    throw new InvalidValueInputError();
  }

  asOutput(): Output {
    throw new InvalidValueOutputError();
  }

  asAccount(): Account {
    throw new InvalidValueAccountError();
  }

  asAsset(): Asset {
    throw new InvalidValueAssetError();
  }

  asContract(): Contract {
    throw new InvalidValueContractError();
  }

  asValidator(): Validator {
    throw new InvalidValueValidatorError();
  }

  asMapStackItem(): MapStackItem {
    throw new InvalidValueMapStackItemError();
  }

  asEnumerator(): StackItemEnumerator<> {
    throw new InvalidValueEnumeratorError();
  }

  asIterator(): StackItemIterator {
    throw new InvalidValueIteratorError();
  }

  asStorageContextStackItem(
    // eslint-disable-next-line
    options: AsStorageContextStackItemOptions,
  ): StorageContextStackItem {
    throw new InvalidValueStorageContextStackItemError();
  }

  isArray(): boolean {
    return false;
  }

  toContractParameter(): ContractParameter {
    throw new Error('Not Implemented');
  }

  get size(): number {
    return this.asBuffer().length;
  }

  toKeyString(): string {
    return `${this.constructor.name}:${this.asBuffer().toString('hex')}`;
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  toJSON(): any {
    try {
      return this.asBuffer().toString('hex');
    } catch (error) {
      return 'UNKNOWN';
    }
  }
}
