import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class BufferStackItem extends StackItemBase {
  public readonly innerBuffer: Buffer;
  public readonly size: number;

  public constructor(data: Buffer) {
    super({
      isNull: false,
      type: StackItemType.Buffer,
    });
    this.innerBuffer = data;
    this.size = data.length;
  }

  public getBoolean() {
    return true;
  }

  public getBuffer() {
    return this.innerBuffer;
  }
}
