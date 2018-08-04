import ts from 'typescript';
import { GlobalProperty, InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { getTypes, invokeDeserialize } from './serialize';

// Input: [val]
// Output: []
export class GenericDeserializeHelper extends Helper {
  public readonly needsGlobal = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.GenericDeserialize);
    // [farr, number, globalObject]
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
    // [objectVal, number, globalObject]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalObjectProperty.Call,
      }),
    );
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    invokeDeserialize(sb, node, options);
  }
}
