import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [map]
// Output: [boolean]
export class IsValidAssetValueMapForSendHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.mapEvery({
        each: () => {
          // [value]
          sb.emitOp(node, 'DROP');
          // [0, value]
          sb.emitPushInt(node, 0);
          // [value < 0]
          sb.emitOp(node, 'LT');
        },
      }),
    );
  }
}
