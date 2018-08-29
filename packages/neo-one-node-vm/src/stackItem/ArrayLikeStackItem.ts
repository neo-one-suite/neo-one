// tslint:disable readonly-array
import { ArrayContractParameter, BinaryWriter, ContractParameter } from '@neo-one/client-core';
import { CircularReferenceError, InvalidValueBufferError } from './errors';
import { StackItem } from './StackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class ArrayLikeStackItem extends StackItemBase {
  public static readonly type: StackItemType;
  public readonly value: StackItem[];

  public constructor(value: StackItem[]) {
    super();
    this.value = value;
  }

  public serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8((this.constructor as typeof ArrayLikeStackItem).type);
    writer.writeVarUIntLE(this.value.length);
    this.value.forEach((item) => {
      writer.writeBytes(item.serialize());
    });

    return writer.toBuffer();
  }

  public isArray(): boolean {
    return true;
  }

  public asArray(): StackItem[] {
    return this.value;
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

    return new ArrayContractParameter(this.value.map((val) => val.toContractParameter(newSeen)));
  }

  public get size(): number {
    return this.value.length;
  }

  // tslint:disable-next-line no-any
  public toJSON(): any {
    return this.value.map((val) => val.toJSON());
  }
}
