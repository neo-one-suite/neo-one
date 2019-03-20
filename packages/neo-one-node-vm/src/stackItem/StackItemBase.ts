import { BinaryWriter, common, ECPoint, UInt160, UInt256 } from '@neo-one/client-common';
import {
  Account,
  Asset,
  Attribute,
  Block,
  BlockBase,
  Contract,
  ContractParameter,
  Equatable,
  Input,
  Output,
  Transaction,
  utils,
  Validator,
  VMSettings,
  Witness,
} from '@neo-one/node-core';
import BN from 'bn.js';
import { BLOCK_HEIGHT_MAX_SIZE_CHECKS, MAX_SIZE_BIG_INTEGER } from '../constants';
import { AttributeStackItem } from './AttributeStackItem';
import {
  IntegerTooLargeError,
  InvalidRecursiveSerializeError,
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
  InvalidValueWitnessError,
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
  private mutableCount = 0;

  public get referenceCount(): number {
    return this.mutableCount;
  }

  public increment(seen = new Set<StackItemBase>()): number {
    if (seen.has(this)) {
      return 1;
    }
    seen.add(this);
    this.mutableCount += 1;

    if (this.mutableCount > 1) {
      return 1;
    }

    return this.incrementInternal(seen) + 1;
  }

  public decrement(seen = new Set<StackItemBase>()): number {
    if (seen.has(this)) {
      return -1;
    }
    seen.add(this);
    this.mutableCount -= 1;

    if (this.mutableCount >= 1) {
      return -1;
    }

    return this.decrementInternal(seen) - 1;
  }

  public toStructuralKey(): string {
    return this.asBuffer().toString('hex');
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
      // Note that we don't use serialize here because
      const thisValue = this.asBufferMaybe();
      const otherValue = other.asBufferMaybe();

      return thisValue !== undefined && otherValue !== undefined && thisValue.equals(otherValue);
    }

    return false;
  }

  public serialize(seen = new Set<StackItemBase>()): Buffer {
    if (seen.has(this)) {
      throw new InvalidRecursiveSerializeError();
    }
    const nextSeen = new Set(seen);
    nextSeen.add(this);

    return this.serializeInternal(nextSeen);
  }

  // tslint:disable-next-line readonly-array
  public asArray(): StackItem[] {
    throw new InvalidValueArrayError();
  }

  public asBigInteger(currentBlockIndex: number): BN {
    if (currentBlockIndex < BLOCK_HEIGHT_MAX_SIZE_CHECKS) {
      return this.asBigIntegerUnsafe();
    }
    const value = this.asBuffer();
    if (value.length > MAX_SIZE_BIG_INTEGER) {
      /* istanbul ignore next */
      throw new IntegerTooLargeError();
    }

    return utils.fromSignedBuffer(value);
  }

  public asBigIntegerUnsafe(): BN {
    return utils.fromSignedBuffer(this.asBuffer());
  }

  public asBuffer(): Buffer {
    /* istanbul ignore next */
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
    return common.bufferToECPoint(this.asBuffer());
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

  public asWitness(): Witness {
    throw new InvalidValueWitnessError();
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
    /* istanbul ignore next */
    throw new InvalidValueStorageContextStackItemError();
  }

  public isArray(): boolean {
    return false;
  }

  public isMap(): boolean {
    return false;
  }

  public toContractParameter(): ContractParameter {
    /* istanbul ignore next */
    throw new Error('Not Implemented');
  }

  public get size(): number {
    return this.asBuffer().length;
  }

  public toString(): string {
    return JSON.stringify(this.convertJSON());
  }

  // tslint:disable-next-line no-any
  public convertJSON(seen = new Set<StackItemBase>()): any {
    if (seen.has(this)) {
      return '<circular>';
    }
    const nextSeen = new Set(seen);
    nextSeen.add(this);

    return this.convertJSONInternal(nextSeen);
  }

  protected incrementInternal(_seen: Set<StackItemBase>): number {
    return 0;
  }

  protected decrementInternal(_seen: Set<StackItemBase>): number {
    return 0;
  }

  protected incrementInternalArray(stackItems: ReadonlyArray<StackItem>, seen: Set<StackItemBase>): number {
    return stackItems.reduce((acc, val) => acc + val.increment(seen), 0);
  }

  protected decrementInternalArray(stackItems: ReadonlyArray<StackItem>, seen: Set<StackItemBase>): number {
    return stackItems.reduce((acc, val) => acc + val.decrement(seen), 0);
  }

  protected serializeInternal(_seen: Set<StackItemBase>): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.ByteArray);
    writer.writeVarBytesLE(this.asBuffer());

    return writer.toBuffer();
  }

  // tslint:disable-next-line no-any
  protected convertJSONInternal(_seen: Set<StackItemBase>): any {
    try {
      return this.asBuffer().toString('hex');
    } catch {
      return 'UNKNOWN';
    }
  }
}
