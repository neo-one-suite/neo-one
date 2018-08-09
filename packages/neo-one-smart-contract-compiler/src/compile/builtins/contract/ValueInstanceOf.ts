import ts from 'typescript';
import { Helper } from '../../helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceOf } from '../BuiltinInstanceOf';

export class ValueInstanceOf extends BuiltinInstanceOf {
  public constructor(private readonly isHelper: (sb: ScriptBuilder) => Helper) {
    super();
  }

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, this.isHelper(sb));
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* instanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
