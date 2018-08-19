import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [objectVal]
// Output: [arr]
export class GetPropertyObjectValuesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
    }

    const objectVal = sb.scope.addUnique();

    // [objectVal, objectVal]
    sb.emitOp(node, 'DUP');
    // [objectVal]
    sb.scope.set(sb, node, options, objectVal);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectKeys);
    // [arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrMap({
        map: (innerOptions) => {
          // [objectVal, key]
          sb.scope.get(sb, node, options, objectVal);
          // [key, objectVal]
          sb.emitOp(node, 'SWAP');
          // [val]
          sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectProperty);
        },
      }),
    );
  }
}
