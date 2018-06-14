import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateFunctionArrayHelperOptions {
  readonly body: () => void;
}

// Input: []
// Output: [farr]
export class CreateFunctionArrayHelper extends Helper {
  private readonly body: () => void;

  public constructor({ body }: CreateFunctionArrayHelperOptions) {
    super();
    this.body = body;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // create function
      // [[scopes, this]]
      sb.scope.pushAll(sb, node, options);
      // [[scopes, this]]
      sb.emitHelper(node, options, sb.helpers.cloneArray);
      // [[scopes, this], [scopes, this]]
      sb.emitOp(node, 'DUP');
      // [0, [scopes, this], [scopes, this]]
      sb.emitPushInt(node, 0);
      // [[scopes, this], 0, [scopes, this], [scopes, this]]
      sb.emitOp(node, 'OVER');
      // [0, [scopes, this], 0, [scopes, this], [scopes, this]]
      sb.emitOp(node, 'OVER');
      // [scopes, 0, [scopes, this], [scopes, this]]
      sb.emitOp(node, 'PICKITEM');
      // [scopes, 0, [scopes, this], [scopes, this]]
      sb.emitHelper(node, options, sb.helpers.cloneArray);
      // [[scopes, this]]
      sb.emitOp(node, 'SETITEM');
      // [target, scopes]
      sb.emitHelper(node, options, sb.helpers.function({ body: this.body }));
      // [2, target, scopes]
      sb.emitPushInt(node, 2);
      // [arr]
      sb.emitOp(node, 'PACK');
    }
  }
}
