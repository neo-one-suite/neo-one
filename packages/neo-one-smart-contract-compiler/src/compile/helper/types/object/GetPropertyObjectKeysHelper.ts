import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [objectVal]
// Output: [arr]
export class GetPropertyObjectKeysHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [pobj]
      sb.emitHelper(node, options, sb.helpers.getPropertyObject);
      // [arr]
      sb.emitOp(node, 'KEYS');
      // [arr]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrFilter({
          map: () => {
            sb.emitPushString(node, '__proto__');
            sb.emitOp(node, 'EQUAL');
            sb.emitOp(node, 'NOT');
          },
        }),
      );
    }
  }
}
