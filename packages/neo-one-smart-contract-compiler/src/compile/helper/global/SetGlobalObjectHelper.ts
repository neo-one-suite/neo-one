import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [globalObjectVal]
export class SetGlobalObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [length, ...args]
    sb.emitOp(node, 'DEPTH');
    // [argv]
    sb.emitOp(node, 'PACK');
    // [globalObjectVal, argv]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [globalObjectVal, globalObjectVal, argv]
    sb.emitOp(node, 'DUP');
    // [globalObjectVal, argv]
    sb.scope.setGlobal(sb, node, options);
    // [globalObjectVal, argv, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [argv, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addArguments);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addObjectObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addBooleanObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addNumberObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addStringObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addSymbolObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addArrayObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addMapObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addBufferObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addErrorObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addModules);
    // [globalObjectVal]
    sb.emitOp(node, 'DROP');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
