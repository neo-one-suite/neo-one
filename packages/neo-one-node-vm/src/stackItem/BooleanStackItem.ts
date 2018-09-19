import { BinaryWriter, BooleanContractParameter, ContractParameter, utils } from '@neo-one/client-core';
import BN from 'bn.js';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class BooleanStackItem extends StackItemBase {
  public static readonly TRUE = Buffer.from([1]);
  public static readonly FALSE = Buffer.from([]);
  public readonly value: boolean;

  public constructor(value: boolean) {
    super();
    this.value = value;
  }

  public asBigInteger(): BN {
    return this.value ? utils.ONE : utils.ZERO;
  }

  public asBoolean(): boolean {
    return this.value;
  }

  public asBuffer(): Buffer {
    return this.value ? BooleanStackItem.TRUE : BooleanStackItem.FALSE;
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new BooleanContractParameter(this.value);
  }

  protected serializeInternal(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Boolean);
    writer.writeBoolean(this.value);

    return writer.toBuffer();
  }
}
