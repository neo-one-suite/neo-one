// tslint:disable readonly-array
import { BinaryWriter } from '@neo-one/client-common';
import { ContractParameter, MapContractParameter } from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { ArrayStackItem } from './ArrayStackItem';
import { CircularReferenceError, InvalidValueBufferError, MissingStackItemKeyError } from './errors';
import { getNextID } from './referenceCounter';
import { StackItem } from './StackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class MapStackItem extends StackItemBase {
  public readonly isICollection = true;
  private readonly referenceKeys: Map<string, StackItem>;
  private readonly referenceValues: Map<string, StackItem>;
  private readonly referenceID = getNextID();

  public constructor({
    referenceKeys = new Map(),
    referenceValues = new Map(),
  }: {
    readonly referenceKeys?: Map<string, StackItem>;
    readonly referenceValues?: Map<string, StackItem>;
  } = {}) {
    super();
    this.referenceKeys = referenceKeys;
    this.referenceValues = referenceValues;
  }

  public toStructuralKey(): string {
    return `${this.referenceID}`;
  }

  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    return this === other;
  }

  public isMap(): boolean {
    return false;
  }

  public asBoolean(): boolean {
    return true;
  }

  public asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  public toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    if (seen.has(this)) {
      throw new CircularReferenceError();
    }
    const newSeen = new Set([...seen]);
    newSeen.add(this);

    return new MapContractParameter(
      this.keysArray().map<readonly [ContractParameter, ContractParameter]>((key) => [
        key.toContractParameter(newSeen),
        this.get(key).toContractParameter(newSeen),
      ]),
    );
  }

  public get size(): number {
    return this.referenceKeys.size;
  }

  public has(item: StackItem): boolean {
    const referenceKey = item.toStructuralKey();

    return this.referenceKeys.get(referenceKey) !== undefined;
  }

  public get(item: StackItem): StackItem {
    const referenceKey = item.toStructuralKey();
    const value = this.referenceValues.get(referenceKey);

    if (value === undefined) {
      throw new MissingStackItemKeyError();
    }

    return value;
  }

  public set(key: StackItem, value: StackItem): this {
    const referenceKey = key.toStructuralKey();
    this.referenceKeys.set(referenceKey, key);
    this.referenceValues.set(referenceKey, value);

    return this;
  }

  public delete(item: StackItem): this {
    const referenceKey = item.toStructuralKey();
    this.referenceKeys.delete(referenceKey);
    this.referenceValues.delete(referenceKey);

    return this;
  }

  public keys(): ArrayStackItem {
    return new ArrayStackItem(this.keysArray());
  }

  public keysArray(): StackItem[] {
    return [...this.referenceKeys.values()];
  }

  public valuesArray(): StackItem[] {
    return [...this.referenceValues.values()];
  }

  public asMapStackItem(): MapStackItem {
    return this;
  }

  protected incrementInternal(seen: Set<StackItemBase>): number {
    return this.incrementInternalArray(this.keysArray(), seen) + this.incrementInternalArray(this.valuesArray(), seen);
  }

  protected decrementInternal(seen: Set<StackItemBase>): number {
    return this.decrementInternalArray(this.keysArray(), seen) + this.decrementInternalArray(this.valuesArray(), seen);
  }

  // tslint:disable-next-line no-any
  protected convertJSONInternal(seen: Set<StackItemBase>): any {
    return _.fromPairs(
      utils
        .zip(this.keysArray(), this.valuesArray())
        .map(([key, value]) => [JSON.stringify(key.convertJSON(seen)), value.convertJSON(seen)]),
    );
  }

  protected serializeInternal(seen: Set<StackItemBase>): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Map);
    const keys = this.keysArray();
    writer.writeVarUIntLE(keys.length);
    keys.forEach((key) => {
      writer.writeBytes(key.serialize(seen));
      writer.writeBytes(this.get(key).serialize(seen));
    });

    return writer.toBuffer();
  }
}
