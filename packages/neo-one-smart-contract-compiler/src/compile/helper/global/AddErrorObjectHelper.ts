import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';
import { InternalFunctionProperties } from '../function';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddErrorObjectHelper extends AddConstructorObjectHelper {
  protected name: string = 'Error';

  protected addConstructorProperties(
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
}
