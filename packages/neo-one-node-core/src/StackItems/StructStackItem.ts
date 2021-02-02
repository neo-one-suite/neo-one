import { StackItemType } from '@neo-one/client-common';
import { ArrayContractParameter, ContractParameter } from '../contractParameter';
import { CircularReferenceError } from './errors';
import { StackItemBase } from './StackItemBase';
import { StackItem } from './StackItems';

export class StructStackItem extends StackItemBase {
  public readonly array: readonly StackItem[];

  public constructor(array: readonly StackItem[]) {
    super({
      type: StackItemType.Struct,
      isNull: false,
    });

    this.array = array;
  }

  public getBoolean() {
    return true;
  }

  public toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    if (seen.has(this)) {
      throw new CircularReferenceError();
    }
    const newSeen = new Set([...seen]);
    newSeen.add(this);

    return new ArrayContractParameter(this.array.map((val) => val.toContractParameter(newSeen)));
  }
}
