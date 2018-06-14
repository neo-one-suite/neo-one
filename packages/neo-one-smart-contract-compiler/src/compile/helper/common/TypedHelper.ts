import { Type } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { Types } from '../types/Types';

export interface TypedHelperOptions {
  readonly type: Type | undefined;
  readonly knownType?: Types;
}

export abstract class TypedHelper extends Helper {
  protected readonly type: Type | undefined;
  protected readonly knownType: Types | undefined;

  public constructor({ knownType, type }: TypedHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
  }
}
