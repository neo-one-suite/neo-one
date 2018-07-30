import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddErrorObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Error';

  protected addConstructorProperties(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');
    // ['construct', objectVal, objectVal, globalObjectVal]
    sb.emitPushString(node, InternalFunctionProperties.Construct);
    // [func, 'construct', objectVal, objectVal, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createConstructArray({
        withoutScope: true,
        body: () => {
          // [this, argsarr]
          sb.scope.getThis(sb, node, options);
          // ['message', this, argsarr]
          sb.emitPushString(node, 'message');
          // [argsarr, 'message', this]
          sb.emitOp(node, 'ROT');
          // [argsarr, argsarr, 'message', this]
          sb.emitOp(node, 'DUP');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [size, argsarr, 'message', this]
                sb.emitOp(node, 'ARRAYSIZE');
                // [1, size, argsarr, 'message', this]
                sb.emitPushInt(node, 1);
                // [boolean, argsarr, 'message', this]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                // [0, argsarr, 'message', this]
                sb.emitPushInt(node, 0);
                // [stringVal, 'message', this]
                sb.emitOp(node, 'PICKITEM');
              },
              whenFalse: () => {
                // ['message', this]
                sb.emitOp(node, 'DROP');
                // [string, 'message', this]
                sb.emitPushString(node, '');
                // [stringVal, 'message', this]
                sb.emitHelper(node, options, sb.helpers.createString);
              },
            }),
          );
          // []
          sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
        },
      }),
    );
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
