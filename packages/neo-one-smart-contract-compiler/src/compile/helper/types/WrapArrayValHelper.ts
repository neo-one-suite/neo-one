import ts from 'typescript';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface WrapArrayValHelperOptions {
  readonly type: WrappableType;
}

// Input: [arr]
// Output: [arrayVal]
export class WrapArrayValHelper extends Helper {
  private readonly type: WrappableType;
  public constructor(options: WrapArrayValHelperOptions) {
    super();
    this.type = options.type;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrMap({
        map: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapVal({ type: this.type }));
        },
      }),
    );
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
  }
}
