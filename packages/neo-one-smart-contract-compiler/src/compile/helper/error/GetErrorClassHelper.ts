import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [val]
export class GetErrorClassHelper extends Helper {
  public readonly needsGlobal: boolean = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const outerOptions = sb.pushValueOptions(optionsIn);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.Error);
    // [classVal, number, globalObjectVal]
    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createClass({
        ctor: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // [val]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [argsarr, argsarr]
                sb.emitOp(node, 'DUP');
                // [size, argsarr]
                sb.emitOp(node, 'ARRAYSIZE');
                // [0, size, argsarr]
                sb.emitPushInt(node, 0);
                // [size === 0, argsarr]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                // []
                sb.emitOp(node, 'DROP');
                // [string]
                sb.emitPushString(node, '');
                // [val]
                sb.emitHelper(node, innerOptions, sb.helpers.createString);
              },
              whenFalse: () => {
                // [0, argsarr]
                sb.emitPushInt(node, 0);
                // [val]
                sb.emitOp(node, 'PICKITEM');
              },
            }),
          );
          // [thisObjectVal, val]
          sb.scope.getThis(sb, node, innerOptions);
          // ['message', thisObjectVal, val]
          sb.emitPushString(node, 'message');
          // [val, 'message', thisObjectVal]
          sb.emitOp(node, 'ROT');
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.setDataPropertyObjectProperty);
        },
      }),
    );
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.Error }));
  }
}
