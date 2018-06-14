import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { Helper } from '../Helper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export abstract class AddConstructorObjectHelper extends Helper {
  protected abstract readonly name: string;

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [globalObjectVal, objectPrototypeVal]
    sb.emitOp(node, 'SWAP');
    // [globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [objectPrototypeVal, globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'OVER');

    // create constructor prototype
    // [prototypeVal, objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [prototypeVal, objectPrototypeVal, prototypeVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // ['prototype', prototypeVal, objectPrototypeVal, prototypeVal, globalObjectVal]
    sb.emitPushString(node, 'prototype');
    // [objectPrototypeVal, 'prototype', prototypeVal, prototypeVal, globalObjectVal]
    sb.emitOp(node, 'ROT');
    // [prototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [prototypeVal, globalObjectVal]
    this.addPrototypeProperties(sb, node, options);

    // create object
    // [objectVal, prototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [prototypeVal, objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['prototype', prototypeVal, objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitPushString(node, 'prototype');
    // [prototypeVal, 'prototype', objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [prototypeVal, objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['constructor', objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitPushString(node, 'constructor');
    // [objectVal, 'constructor', prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [objectVal, globalObjectVal]
    this.addConstructorProperties(sb, node, options);
    // [name, objectVal, globalObjectVal]
    sb.emitPushString(node, this.name);
    // [objectVal, name, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
  }

  protected addPrototypeProperties(_sb: ScriptBuilder, _node: Node, _options: VisitOptions): void {
    // do nothing
  }

  protected addConstructorProperties(_sb: ScriptBuilder, _node: Node, _options: VisitOptions): void {
    // do nothing
  }

  protected addMethod(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    name: string,
    body: (options: VisitOptions) => void,
  ): void {
    // [prototypeVal, prototypeVal, globalObjectVal]
    sb.emitOp(node, 'DUP');
    // [name, prototypeVal, prototypeVal, globalObjectVal]
    sb.emitPushString(node, name);
    // [farr, name, prototypeVal, prototypeVal, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: () => {
          sb.withScope(node, options, body);
          sb.emitHelper(node, options, sb.helpers.createNormalCompletion);
          sb.emitOp(node, 'RET');
        },
      }),
    );
    // [fobjectVal, name, prototypeVal, prototypeVal, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.Call,
      }),
    );
    // [prototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
  }
}
