/* @flow */
import {
  type ContractParameter,
  type ECPoint,
  PublicKeyContractParameter,
  common,
} from '@neo-one/client-core';

import StackItemBase from './StackItemBase';

export default class ECPointStackItem extends StackItemBase {
  value: ECPoint;

  constructor(value: ECPoint) {
    super();
    this.value = value;
  }

  equals(other: mixed): boolean {
    if (other == null) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (other instanceof StackItemBase) {
      const point = other.asECPointMaybe();
      return point != null && common.ecPointEqual(this.value, point);
    }

    return false;
  }

  asECPoint(): ECPoint {
    return this.value;
  }

  asBuffer(): Buffer {
    return common.ecPointToBuffer(this.value);
  }

  toContractParameter(): ContractParameter {
    return new PublicKeyContractParameter(this.value);
  }
}
