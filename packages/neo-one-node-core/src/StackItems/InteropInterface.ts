import { InvalidInteropInterfaceValueError, InvalidStackItemCastError } from '../errors';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

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
}
