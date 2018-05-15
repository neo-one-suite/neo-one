import { Type } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { Types } from '../types/Types';

export interface TypedHelperOptions {
  type: Type | undefined;
  knownType?: Types;
}

export abstract class TypedHelper extends Helper {
  protected readonly type: Type | undefined;
  protected readonly knownType: Types | undefined;

  constructor({ knownType, type }: TypedHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
  }
}
