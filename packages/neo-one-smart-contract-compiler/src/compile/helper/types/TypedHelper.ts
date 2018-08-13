import ts from 'typescript';
import { Types } from '../../constants';
import { Helper } from '../Helper';

export interface TypedHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
}

export abstract class TypedHelper<Node extends ts.Node = ts.Node> extends Helper<Node> {
  protected readonly type: ts.Type | undefined;
  protected readonly knownType: Types | undefined;

  public constructor({ knownType, type }: TypedHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
  }
}
