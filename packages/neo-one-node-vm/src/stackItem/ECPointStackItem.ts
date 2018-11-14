import { common, ECPoint } from '@neo-one/client-common';
import { ContractParameter, PublicKeyContractParameter } from '@neo-one/node-core';
import { StackItemBase } from './StackItemBase';

export class ECPointStackItem extends StackItemBase {
  public readonly value: ECPoint;

  public constructor(value: ECPoint) {
    super();
    this.value = value;
  }

  public asECPoint(): ECPoint {
    return this.value;
  }

  public asBuffer(): Buffer {
    return common.ecPointToBuffer(this.value);
  }

  public toContractParameter(_seen: Set<StackItemBase> = new Set()): ContractParameter {
    return new PublicKeyContractParameter(this.value);
  }
}
