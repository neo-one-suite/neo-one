import { StackItemAdd, StackItemBase } from './StackItemBase';

export interface PrimitiveStackItemAdd extends StackItemAdd {
  readonly memory: Buffer;
  readonly size?: number;
}

export class PrimitiveStackItemBase extends StackItemBase {
  public readonly size: number;
  protected readonly memory: Buffer;

  public constructor(options: PrimitiveStackItemAdd) {
    super(options);
    this.memory = options.memory;
    this.size = options.size ? options.size : this.memory.length;
  }

  public getBuffer(): Buffer {
    return this.memory;
  }
}
