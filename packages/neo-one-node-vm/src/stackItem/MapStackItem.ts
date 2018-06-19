// tslint:disable readonly-array
import { BinaryWriter, ContractParameter, InteropInterfaceContractParameter } from '@neo-one/client-core';
import { ArrayStackItem } from './ArrayStackItem';
import { InvalidValueBufferError } from './errors';
import { StackItem } from './StackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

interface MapKeys {
  // tslint:disable-next-line readonly-keyword
  [key: string]: StackItem;
}
interface MapValues {
  // tslint:disable-next-line readonly-keyword
  [key: string]: StackItem;
}
export class MapStackItem extends StackItemBase {
  private readonly mutableKeys: MapKeys;
  private readonly mutableValues: MapValues;

  public constructor({ keys = {}, values = {} }: { readonly keys?: MapKeys; readonly values?: MapValues } = {}) {
    super();
    this.mutableKeys = keys;
    this.mutableValues = values;
  }

  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

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
    return Object.keys(this.mutableValues).length;
  }

  public has(item: StackItem): boolean {
    const key = item.toKeyString();

    return (this.mutableKeys[key] as StackItem | undefined) !== undefined;
  }

  public get(item: StackItem): StackItem {
    const key = item.toKeyString();

    return this.mutableValues[key];
  }

  public set(key: StackItem, value: StackItem): this {
    const keyValue = key.toKeyString();
    this.mutableKeys[keyValue] = key;
    this.mutableValues[keyValue] = value;

    return this;
  }

  public delete(item: StackItem): this {
    const key = item.toKeyString();
    // tslint:disable-next-line no-dynamic-delete
    delete this.mutableKeys[key];
    // tslint:disable-next-line no-dynamic-delete
    delete this.mutableValues[key];

    return this;
  }

  public keys(): ArrayStackItem {
    return new ArrayStackItem(this.keysArray());
  }

  public keysArray(): StackItem[] {
    return Object.values(this.mutableKeys);
  }

  public valuesArray(): StackItem[] {
    return Object.values(this.mutableValues);
  }

  public asMapStackItem(): MapStackItem {
    return this;
  }

  // tslint:disable-next-line no-any
  public toJSON(): any {
    return Object.keys(this.mutableKeys);
  }
}
