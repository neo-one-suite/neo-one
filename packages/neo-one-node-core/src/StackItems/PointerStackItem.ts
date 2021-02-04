import { StackItemType } from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  ArrayContractParameter,
  ByteArrayContractParameter,
  ContractParameter,
  IntegerContractParameter,
} from '../contractParameter';
import { StackItemBase } from './StackItemBase';
import { isPointerStackItem, StackItem } from './StackItems';

// TODO: can decide if we need to implement this later;
export type PointerStackItemScript = Buffer;

export interface PointerStackItemAdd {
  readonly script: PointerStackItemScript;
  readonly position: number;
}

export class PointerStackItem extends StackItemBase {
  public readonly script: PointerStackItemScript;
  public readonly position: number;

  public constructor({ script, position }: PointerStackItemAdd) {
    super({
      type: StackItemType.Pointer,
      isNull: false,
    });
    this.script = script;
    this.position = position;
  }

  public equals(other: StackItem) {
    if (other === this) {
      return true;
    }

    if (isPointerStackItem(other)) {
      return this.position === other.position && this.script.equals(other.script);
    }

    return false;
  }

  public getBoolean() {
    return true;
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ArrayContractParameter([
      new ByteArrayContractParameter(this.script),
      new IntegerContractParameter(new BN(this.position)),
    ]);
  }
}
