import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { Helper } from '../Helper';
import { DESERIALIZE_NAME, getTypes, invokeDeserialize } from './serialize';

// Input: [val]
// Output: []
export class GenericDeserializeHelper extends Helper {
  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [globalObjectVal]
    sb.scope.getGlobal(sb, node, options);
    // [name, globalObjectVal]
    sb.emitPushString(node, DESERIALIZE_NAME);
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
                  forType.isSerializedType();
                },
                whenTrue: () => {
                  forType.deserialize();
                  sb.emitHelper(node, options, sb.helpers.return);
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

    invokeDeserialize(sb, node, options);
  }
}
