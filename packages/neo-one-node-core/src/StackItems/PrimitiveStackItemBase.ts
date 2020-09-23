import { BN } from 'bn.js';
import { InvalidStackItemCastError } from 'src/errors';
import { StackItemAdd, StackItemBase } from './StackItemBase';

const MIN_SAFE_BN = new BN(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_BN = new BN(Number.MAX_SAFE_INTEGER);

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

  public toInt32(): number {
    const int = this.getInteger();
    if (int.lt(MIN_SAFE_BN) || int.gt(MAX_SAFE_BN)) {
      throw new InvalidStackItemCastError();
    }

    return int.toNumber();
  }
}
