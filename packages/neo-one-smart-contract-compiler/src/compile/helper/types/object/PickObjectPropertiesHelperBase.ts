import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [stringArr, objectVal, outputObjectVal]
// Output: []
export abstract class PickObjectPropertiesHelperBase extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const objectValName = sb.scope.addUnique();
    const outputObjectValName = sb.scope.addUnique();
    // [objectVal, stringArr, outputObjectVal]
    sb.emitOp(node, 'SWAP');
    // [stringArr, outputObjectVal]
    sb.scope.set(sb, node, options, objectValName);
    // [outputObjectVal, stringArr]
    sb.emitOp(node, 'SWAP');
    // [stringArr]
    sb.scope.set(sb, node, options, outputObjectValName);

    sb.emitHelper(
      node,
      options,
      sb.helpers.arrForEach({
        each: () => {
          // [outputObjectVal, string]
          sb.scope.get(sb, node, options, outputObjectValName);
          // [string, outputObjectVal]
          sb.emitOp(node, 'SWAP');
          // [objectVal, string, outputObjectVal]
          sb.scope.get(sb, node, options, objectValName);
          // [string, objectVal, string, outputObjectVal]
          sb.emitOp(node, 'OVER');
          // [val, string, outputObjectVal]
          sb.emitHelper(node, options, this.getObjectProperty(sb));
          // []
          sb.emitHelper(node, options, this.setObjectDataProperty(sb));
        },
      }),
    );
  }

  protected abstract getObjectProperty(sb: ScriptBuilder): Helper;
  protected abstract setObjectDataProperty(sb: ScriptBuilder): Helper;
}
