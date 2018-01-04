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

    return (
      other instanceof StackItemBase &&
      common.ecPointEqual(this.value, other.asECPoint())
    );
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
