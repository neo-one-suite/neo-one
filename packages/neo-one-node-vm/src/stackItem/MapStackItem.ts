// tslint:disable readonly-array
import { BinaryWriter, ContractParameter, InteropInterfaceContractParameter } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { ArrayStackItem } from './ArrayStackItem';
import { InvalidValueBufferError, MissingStackItemKeyError } from './errors';
import { getNextID } from './referenceCounter';
import { StackItem } from './StackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class MapStackItem extends StackItemBase {
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

  public serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Map);
    const keys = this.keysArray();
    writer.writeVarUIntLE(keys.length);
    keys.forEach((key) => {
      writer.writeBytes(key.serialize());
      writer.writeBytes(this.get(key).serialize());
    });

    return writer.toBuffer();
  }

  public asBoolean(): boolean {
    return true;
  }

  public asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new InteropInterfaceContractParameter();
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

  // tslint:disable-next-line no-any
  public toJSON(): any {
    return _.fromPairs(
      utils.zip(this.keysArray(), this.valuesArray()).map(([key, value]) => [JSON.stringify(key.toJSON()), value]),
    );
  }
}
