import { Types } from '../../constants';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface KeyStructuredStorageBaseHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly keyType: ts.Type | undefined;
  readonly knownKeyType?: Types;
}

// Input: [keyBuffer]
// Output: [value]
export abstract class KeyStructuredStorageBaseHelper extends StructuredStorageBaseHelper {
  protected readonly keyType: ts.Type | undefined;
  protected readonly knownKeyType?: Types;

  public constructor({ keyType, knownKeyType, ...rest }: KeyStructuredStorageBaseHelperOptions) {
    super(rest);
    this.keyType = keyType;
    this.knownKeyType = knownKeyType;
  }
}
