import { Script, StackItemType } from '@neo-one/client-common';
import { BN } from 'bn.js';
import {
  ArrayContractParameter,
  ByteArrayContractParameter,
  ContractParameter,
  IntegerContractParameter,
} from '../contractParameter';
import { StackItemBase } from './StackItemBase';
import { isPointerStackItem, StackItem } from './StackItems';

export interface PointerStackItemAdd {
  readonly script: Script;
  readonly position: number;
}

export class PointerStackItem extends StackItemBase {
  public readonly script: Script;
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
      return this.position === other.position && this.script.buffer.equals(other.script.buffer);
    }

    return false;
  }

  public getBoolean() {
    return true;
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ArrayContractParameter([
      new ByteArrayContractParameter(this.script.buffer),
      new IntegerContractParameter(new BN(this.position)),
    ]);
  }
}
