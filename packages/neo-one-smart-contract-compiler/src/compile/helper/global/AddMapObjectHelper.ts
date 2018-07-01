import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddMapObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Map';

  protected addPrototypeProperties(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    this.addClear(sb, node, options);
    this.addDelete(sb, node, options);
    this.addGet(sb, node, options);
    this.addSet(sb, node, options);
  }

  protected addConstructorProperties(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
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
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [argsarray, argsarray]
                sb.emitOp(node, 'DUP');
                // [size, argsarray]
                sb.emitOp(node, 'ARRAYSIZE');
                // [0, size, argsarray]
                sb.emitPushInt(node, 0);
                // [size == 0, argsarray]
                sb.emitOp(node, 'EQUAL');
              },
              whenTrue: () => {
                // []
                sb.emitOp(node, 'DROP');
                // [this]
                sb.scope.getThis(sb, node, options);
                // [map, this]
                sb.emitOp(node, 'NEWMAP');
              },
              whenFalse: () => {
                // Not implemented
                sb.emitHelper(node, options, sb.helpers.throwTypeError);
              },
            }),
          );
          // []
          sb.emitHelper(node, options, sb.helpers.setMapValue);
        },
      }),
    );
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }

  private addClear(sb: ScriptBuilder, node: Node, outerOptions: VisitOptions): void {
    this.addMethod(sb, node, outerOptions, 'clear', (options) => {
      // []
      sb.emitOp(node, 'DROP');
      // [this]
      sb.scope.getThis(sb, node, options);
      // [map, this]
      sb.emitOp(node, 'NEWMAP');
      // []
      sb.emitHelper(node, options, sb.helpers.setMapValue);
    });
  }

  private addDelete(sb: ScriptBuilder, node: Node, outerOptions: VisitOptions): void {
    this.addMethod(sb, node, outerOptions, 'delete', (options) => {
      // [argsarr]
      sb.emitPushInt(node, 0);
      // [key]
      sb.emitOp(node, 'PICKITEM');
      // [serialized]
      sb.emitHelper(node, options, sb.helpers.genericSerialize);
      // [keyBuffer]
      sb.emitSysCall(node, 'Neo.Runtime.Serialize');
      // [this, keyBuffer]
      sb.scope.getThis(sb, node, options);
      // [map, keyBuffer]
      sb.emitHelper(node, options, sb.helpers.unwrapMap);
      // [map, keyBuffer, map]
      sb.emitOp(node, 'TUCK');
      // [keyBuffer, map, keyBuffer, map]
      sb.emitOp(node, 'OVER');
      // [hasKey, keyBuffer, map]
      sb.emitOp(node, 'HASKEY');
      // [map, hasKey, keyBuffer]
      sb.emitOp(node, 'ROT');
      // [keyBuffer, map, hasKey]
      sb.emitOp(node, 'ROT');
      // [hasKey]
      sb.emitOp(node, 'REMOVE');
      // [boolVal]
      sb.emitHelper(node, options, sb.helpers.createBoolean);
    });
  }

  private addGet(sb: ScriptBuilder, node: Node, outerOptions: VisitOptions): void {
    this.addMethod(sb, node, outerOptions, 'get', (options) => {
      // [argsarr]
      sb.emitPushInt(node, 0);
      // [key]
      sb.emitOp(node, 'PICKITEM');
      // [serialized]
      sb.emitHelper(node, options, sb.helpers.genericSerialize);
      // [keyBuffer]
      sb.emitSysCall(node, 'Neo.Runtime.Serialize');
      // [this, keyBuffer]
      sb.scope.getThis(sb, node, options);
      // [map, keyBuffer]
      sb.emitHelper(node, options, sb.helpers.unwrapMap);
      // [map, keyBuffer, map]
      sb.emitOp(node, 'TUCK');
      // [keyBuffer, map, keyBuffer, map]
      sb.emitOp(node, 'OVER');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [hasKey, keyBuffer, map]
            sb.emitOp(node, 'HASKEY');
          },
          whenTrue: () => {
            // [val]
            sb.emitOp(node, 'PICKITEM');
          },
          whenFalse: () => {
            // [map]
            sb.emitOp(node, 'DROP');
            // []
            sb.emitOp(node, 'DROP');
            // [undefinedVal]
            sb.emitHelper(node, options, sb.helpers.createUndefined);
          },
        }),
      );
    });
  }

  private addSet(sb: ScriptBuilder, node: Node, outerOptions: VisitOptions): void {
    this.addMethod(sb, node, outerOptions, 'set', (options) => {
      // [this, argsarr]
      sb.scope.getThis(sb, node, options);
      // [this, argsarr, this]
      sb.emitOp(node, 'TUCK');
      // [map, argsarr, this]
      sb.emitHelper(node, options, sb.helpers.getMapValue);
      // [argsarr, map, this]
      sb.emitOp(node, 'SWAP');
      // [length, keyVal, valueVal, map, this]
      sb.emitOp(node, 'UNPACK');
      // [keyVal, valueVal, map, this]
      sb.emitOp(node, 'DROP');
      // [serialized, valueVal, map, this]
      sb.emitHelper(node, options, sb.helpers.genericSerialize);
      // [buffer, valueVal, map, this]
      sb.emitSysCall(node, 'Neo.Runtime.Serialize');
      // [valueVal, buffer, map, this]
      sb.emitOp(node, 'SWAP');
      // [this]
      sb.emitOp(node, 'SETITEM');
    });
  }
}
