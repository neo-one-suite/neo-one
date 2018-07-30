import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { Helper } from '../Helper';
import { getTypes, invokeSerialize, SERIALIZE_NAME } from './serialize';

// Input: [val]
// Output: []
export class GenericSerializeHelper extends Helper {
  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [globalObjectVal]
    sb.scope.getGlobal(sb, node, options);
    // [name, globalObjectVal]
    sb.emitPushString(node, SERIALIZE_NAME);
    // [farr, name, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: () => {
          // [0, argsarr]
          sb.emitPushInt(node, 0);
          // [val]
          sb.emitOp(node, 'PICKITEM');
          sb.emitHelper(
            node,
            options,
            sb.helpers.case(
              getTypes(sb, node, options).map((forType) => ({
                condition: () => {
                  sb.emitOp(node, 'DUP');
                  forType.isRuntimeType();
                },
                whenTrue: () => {
                  forType.serialize();
                  sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createNormalCompletion);
                  sb.emitOp(node, 'RET');
                },
              })),
              () => {
                sb.emitOp(node, 'DROP');
                sb.emitHelper(node, options, sb.helpers.throwTypeError);
              },
            ),
          );
        },
      }),
    );
    // [objectVal, name, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.Call,
      }),
    );
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    invokeSerialize(sb, node, options);
  }
}
