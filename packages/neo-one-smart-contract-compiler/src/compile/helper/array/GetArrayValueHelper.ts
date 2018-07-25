import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalArrayProperties } from './InternalArrayProperties';

// Input: [objectVal]
// Output: [arr]
export class GetArrayValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // ['DataArray', objectVal]
    sb.emitPushString(node, InternalArrayProperties.DATA_ARRAY);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  }
}
