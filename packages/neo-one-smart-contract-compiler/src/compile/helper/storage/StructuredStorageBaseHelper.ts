import { WrappableType } from '../../constants';
import { Helper } from '../Helper';

export interface StructuredStorageBaseHelperOptions {
  readonly type: WrappableType;
}

// Input: [keyBuffer]
// Output: [value]
export abstract class StructuredStorageBaseHelper extends Helper {
  protected readonly type: WrappableType;

  public constructor({ type }: StructuredStorageBaseHelperOptions) {
    super();
    this.type = type;
  }
}
