import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';
import { InternalFunctionProperties } from '../function';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddBufferObjectHelper extends AddConstructorObjectHelper {
  protected name: string = 'Buffer';

  protected addConstructorProperties(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    this.addConstructor(sb, node, options);
    this.addConcat(sb, node, options);
  }

  private addConstructor(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [objectVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');
    // ['construct', objectVal, objectVal, globalObjectVal]
    sb.emitPushString(node, InternalFunctionProperties.CONSTRUCT);
    // [func, 'construct', objectVal, objectVal, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createConstructArray({
        withoutScope: true,
        body: () => {
          // Drop the args array
          // []
          sb.emitOp(node, 'DROP');
        },
      }),
    );
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }

  private addConcat(
    sb: ScriptBuilder,
    node: Node,
    outerOptions: VisitOptions,
  ): void {
    this.addMethod(sb, node, outerOptions, 'concat', (options) => {
      // [0, argsarr]
      sb.emitPushInt(node, 0);
      // [arrayObjectVal]
      sb.emitOp(node, 'PICKITEM');
      // [array]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [buffer, array]
      sb.emitOp(node, 'PUSH0');
      sb.emitHelper(
        node,
        options,
        sb.helpers.forLoop({
          condition: () => {
            // [array, buffer, array]
            sb.emitOp(node, 'OVER');
            // [size, buffer, array]
            sb.emitOp(node, 'ARRAYSIZE');
            // [0, size, buffer, array]
            sb.emitPushInt(node, 0);
            // [size > 0, buffer, array]
            sb.emitOp(node, 'GT');
          },
          each: () => {
            // [array, buffer, array]
            sb.emitOp(node, 'OVER');
            // [0, array, buffer, array]
            sb.emitPushInt(node, 0);
            // [rightBufferVal, buffer, array]
            sb.emitOp(node, 'PICKITEM');
            // [rightBuffer, buffer, array]
            sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
            // [buffer + rightBuffer, array]
            sb.emitOp(node, 'CAT');
            // [array, buffer, array]
            sb.emitOp(node, 'OVER');
            // [0, array, buffer, array]
            sb.emitPushInt(node, 0);
            // [buffer, array]
            sb.emitOp(node, 'REMOVE');
          },
        }),
      );
      // [buffer]
      sb.emitOp(node, 'NIP');
      // [bufferVal]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    });
  }
}
