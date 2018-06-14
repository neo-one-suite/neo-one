import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddObjectObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');

    // create object prototype
    // [objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectPrototypeVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');

    // create object
    // [objectVal, objectPrototypeVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal, objectPrototypeVal, objectVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // ['prototype', objectVal, objectPrototypeVal, objectVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitPushString(node, 'prototype');
    // [objectPrototypeVal, 'prototype', objectVal, objectVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'ROT');
    // [objectVal, objectPrototypeVal, globalObjectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [objectVal, objectPrototypeVal, objectVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [objectPrototypeVal, objectVal, objectPrototypeVal, objectVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['constructor', objectPrototypeVal, objectVal, objectPrototypeVal, objectVal, globalObjectVal, globalObjectVal]
    sb.emitPushString(node, 'constructor');
    // [objectVal, 'constructor', objectPrototypeVal, objectPrototypeVal, objectVal, globalObjectVal, globalObjectVal]
    sb.emitOp(node, 'ROT');
    // [objectPrototypeVal, objectVal, globalObjectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [globalObjectVal, objectPrototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'ROT');
    // ['Object', globalObjectVal, objectPrototypeVal, objectVal, globalObjectVal]
    sb.emitPushString(node, 'Object');
    // ['Object', globalObjectVal, objectPrototypeVal, objectVal, globalObjectVal]
    sb.emitPushInt(node, 3);
    // [objectVal, 'Object', globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'ROLL');
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
  }
}
