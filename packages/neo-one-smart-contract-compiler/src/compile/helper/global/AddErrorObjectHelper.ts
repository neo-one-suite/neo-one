import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddErrorObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Error';

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
