import { StackItemType } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParameter } from '../contractParameter';

export interface StackItemAdd {
  readonly isNull: boolean;
  readonly type: StackItemType;
}

export abstract class StackItemBase {
  public readonly isNull: boolean;
  public readonly type: StackItemType;

  public constructor({ isNull, type }: StackItemAdd) {
    this.isNull = isNull;
    this.type = type;
  }

  public getBoolean(): boolean {
    throw new Error('method not implemented');
  }

  public getInteger(): BN {
    throw new Error('method not implemented');
  }

  // tslint:disable-next-line: no-any
  public getInterface<T>(_isFunc?: (value: any) => value is T): T | undefined {
    throw new Error('method not implemented');
  }

  public getBuffer(): Buffer {
    throw new Error('method not implemented');
  }

  public getString(): string {
    return this.getBuffer().toString('utf-8');
  }

  public toContractParameter(): ContractParameter {
    /* istanbul ignore next */
    throw new Error('method not implemented');
  }
}
