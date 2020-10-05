import { StackItemBase } from './StackItemBase';
import { isPointerStackItem, StackItem } from './StackItems';
import { StackItemType } from './StackItemType';

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
}
