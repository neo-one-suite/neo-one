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
    return this.asBuffer().some(value => value !== 0);
  }

  asUInt160(): UInt160 {
    return common.bufferToUInt160(this.asBuffer());
  }

  asUInt256(): UInt256 {
    return common.bufferToUInt256(this.asBuffer());
  }

  asECPoint(): ECPoint {
    // TODO: This may be incorrect. neo source code indicates a 0 length
    //       byte array is not a valid ECPoint, yet one of the invocations
    //       on the test net only succeeds if we interpret it as an infinity
    //       ECPoint.
    const buffer = this.asBuffer();
    return buffer.length === 0
      ? common.ECPOINT_INFINITY
      : common.bufferToECPoint(buffer);
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
    try {
      return this.asBuffer().toString('hex');
    } catch (error) {
      return 'UNKNOWN';
    }
  }
}
