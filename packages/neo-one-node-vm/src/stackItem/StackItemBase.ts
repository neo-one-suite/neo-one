import {
  Account,
  Asset,
  Attribute,
  BinaryWriter,
  Block,
  BlockBase,
  common,
  Contract,
  ContractParameter,
  ECPoint,
  Equatable,
  Input,
  Output,
  Transaction,
  UInt160,
  UInt256,
  utils,
  Validator,
  VMSettings,
} from '@neo-one/client-core';
import { BN } from 'bn.js';
import { AttributeStackItem } from './AttributeStackItem';
import {
  InvalidValueAccountError,
  InvalidValueArrayError,
  InvalidValueAssetError,
  InvalidValueAttributeError,
  InvalidValueAttributeStackItemError,
  InvalidValueBlockBaseError,
  InvalidValueBlockError,
  InvalidValueContractError,
  InvalidValueEnumeratorError,
  InvalidValueHeaderError,
  InvalidValueInputError,
  InvalidValueIteratorError,
  InvalidValueMapStackItemError,
  InvalidValueOutputError,
  InvalidValueStorageContextStackItemError,
  InvalidValueTransactionError,
  InvalidValueValidatorError,
} from './errors';
import { MapStackItem } from './MapStackItem';
import { StackItem } from './StackItem';
import { StackItemEnumerator } from './StackItemEnumerator';
import { StackItemIterator } from './StackItemIterator';
import { StackItemType } from './StackItemType';
import { StorageContextStackItem } from './StorageContextStackItem';

export interface AsStorageContextStackItemOptions {
  readonly currentBlockIndex: number;
  readonly vm: VMSettings;
  readonly scriptHash: UInt160;
  readonly callingScriptHash: UInt160 | undefined;
  readonly entryScriptHash: UInt160;
}

export class StackItemBase implements Equatable {
  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    return this === other;
  }

  public serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.ByteArray);
    writer.writeVarBytesLE(this.asBuffer());

    return writer.toBuffer();
  }

  // tslint:disable-next-line readonly-array
  public asArray(): StackItem[] {
    throw new InvalidValueArrayError();
  }

  public asBigInteger(): BN {
    return utils.fromSignedBuffer(this.asBuffer());
  }

  public asBuffer(): Buffer {
    throw new Error('Unimplemented.');
  }

  public asBufferMaybe(): Buffer | undefined {
    try {
      return this.asBuffer();
    } catch {
      return undefined;
    }
  }

  public asBoolean(): boolean {
    return this.asBuffer().some((value) => value !== 0);
  }

  public asUInt160(): UInt160 {
    return common.bufferToUInt160(this.asBuffer());
  }

  public asUInt160Maybe(): UInt160 | undefined {
    try {
      return this.asUInt160();
    } catch {
      return undefined;
    }
  }

  public asUInt256(): UInt256 {
    return common.bufferToUInt256(this.asBuffer());
  }

  public asUInt256Maybe(): UInt256 | undefined {
    try {
      return this.asUInt256();
    } catch {
      return undefined;
    }
  }

  public asECPoint(): ECPoint {
    const buffer = this.asBuffer();

    return buffer.length === 0 ? common.ECPOINT_INFINITY : common.bufferToECPoint(buffer);
  }

  public asECPointMaybe(): ECPoint | undefined {
    try {
      return this.asECPoint();
    } catch {
      return undefined;
    }
  }

  public asString(): string {
    return utils.toUTF8(this.asBuffer());
  }

  public asHeader(): BlockBase {
    throw new InvalidValueHeaderError();
  }

  public asBlockBase(): BlockBase {
    throw new InvalidValueBlockBaseError();
  }

  public asBlock(): Block {
    throw new InvalidValueBlockError();
  }

  public asTransaction(): Transaction {
    throw new InvalidValueTransactionError();
  }

  public asAttribute(): Attribute {
    throw new InvalidValueAttributeError();
  }

  public asAttributeStackItem(): AttributeStackItem {
    throw new InvalidValueAttributeStackItemError();
  }

  public asInput(): Input {
    throw new InvalidValueInputError();
  }

  public asOutput(): Output {
    throw new InvalidValueOutputError();
  }

  public asAccount(): Account {
    throw new InvalidValueAccountError();
  }

  public asAsset(): Asset {
    throw new InvalidValueAssetError();
  }

  public asContract(): Contract {
    throw new InvalidValueContractError();
  }

  public asValidator(): Validator {
    throw new InvalidValueValidatorError();
  }

  public asMapStackItem(): MapStackItem {
    throw new InvalidValueMapStackItemError();
  }

  public asEnumerator(): StackItemEnumerator {
    throw new InvalidValueEnumeratorError();
  }

  public asIterator(): StackItemIterator {
    throw new InvalidValueIteratorError();
  }

  public asStorageContextStackItem(_options: AsStorageContextStackItemOptions): StorageContextStackItem {
    throw new InvalidValueStorageContextStackItemError();
  }

  public isArray(): boolean {
    return false;
  }

  public toContractParameter(): ContractParameter {
    throw new Error('Not Implemented');
  }

  public get size(): number {
    return this.asBuffer().length;
  }

  public toKeyString(): string {
    return `${this.constructor.name}:${this.asBuffer().toString('hex')}`;
  }

  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  // tslint:disable-next-line no-any
  public toJSON(): any {
    try {
      return this.asBuffer().toString('hex');
    } catch {
      return 'UNKNOWN';
    }
  }
}
