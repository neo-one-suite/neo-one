import { StackItemType } from '@neo-one/client-common';
import { ByteArrayContractParameter, ContractParameter } from '../contractParameter';
import { StackItemBase } from './StackItemBase';

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

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new ByteArrayContractParameter(this.innerBuffer);
  }
}
