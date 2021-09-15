import { StackItemType } from '@neo-one/client-common';
import { ContractParameter, InteropInterfaceContractParameter } from '../contractParameter';
import { InvalidInteropInterfaceValueError, InvalidStackItemCastError } from '../errors';
import { StackItemBase } from './StackItemBase';

// tslint:disable: no-any
export class InteropInterface extends StackItemBase {
  private readonly value: any;

  public constructor(value?: any) {
    super({
      type: StackItemType.InteropInterface,
      isNull: false,
    });

    if (value === undefined) {
      throw new InvalidInteropInterfaceValueError();
    }

    this.value = value;
  }

  public getBoolean() {
    return true;
  }

  public getInterface<T>(isFunc: (value: any) => value is T): T {
    if (isFunc(this.value)) {
      return this.value;
    }

    throw new InvalidStackItemCastError();
  }

  public toContractParameter(): ContractParameter {
    return new InteropInterfaceContractParameter();
  }
}
