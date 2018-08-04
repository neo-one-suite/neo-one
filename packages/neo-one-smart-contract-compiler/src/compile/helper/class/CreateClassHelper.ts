import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

type Prop = (options: VisitOptions) => void;
interface Properties {
  readonly [key: string]: Prop;
}
export interface CreateClassHelperOptions {
  readonly ctor?: (options: VisitOptions) => void;
  readonly prototypeMethods?: Properties;
  readonly classMethods?: Properties;
}

// Input: []
// Output: [classVal]
export class CreateClassHelper extends Helper {
  private readonly ctor?: (options: VisitOptions) => void;
  private readonly prototypeMethods: Properties;
  private readonly classMethods: Properties;

  public constructor(options: CreateClassHelperOptions) {
    super();
    this.ctor = options.ctor;
    this.prototypeMethods = options.prototypeMethods === undefined ? {} : options.prototypeMethods;
    this.classMethods = options.classMethods === undefined ? {} : options.classMethods;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // create prototype
    // [prototypeVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [prototypeVal]
    Object.entries(this.prototypeMethods).forEach(([name, body]) => {
      // [prototypeVal, prototypeVal]
      sb.emitOp(node, 'DUP');
      // [name, prototypeVal, prototypeVal]
      sb.emitPushString(node, name);
      // [farr, name, prototypeVal, prototypeVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createFunctionArray({
          body: (innerOptions) => {
            body(sb.pushValueOptions(innerOptions));
            sb.emitHelper(node, innerOptions, sb.helpers.return);
          },
        }),
      );
      // [fobjectVal, name, prototypeVal, prototypeVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createFunctionObject({
          property: InternalObjectProperty.Call,
        }),
      );
      // [prototypeVal]
      sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    });

    // create class
    // [farr, prototypeVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createConstructArray({
        withScope: false,
        body: (innerOptions) => {
          if (this.ctor !== undefined) {
            this.ctor(innerOptions);
          }
        },
      }),
    );
    // [classVal, prototypeVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalObjectProperty.Construct,
      }),
    );
    // [classVal, prototypeVal, classVal]
    sb.emitOp(node, 'TUCK');
    // ['prototype', classVal, prototypeVal, classVal]
    sb.emitPushString(node, 'prototype');
    // [prototypeVal, 'prototype', classVal, classVal]
    sb.emitOp(node, 'ROT');
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [classVal]
    Object.entries(this.classMethods).forEach(([name, body]) => {
      // [classVal, classVal]
      sb.emitOp(node, 'DUP');
      // [name, classVal, classVal]
      sb.emitPushString(node, name);
      // [farr, name, classVal, classVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createFunctionArray({
          body: (innerOptions) => {
            body(sb.pushValueOptions(innerOptions));
            sb.emitHelper(node, options, sb.helpers.return);
          },
        }),
      );
      // [fobjectVal, name, classVal, classVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createFunctionObject({
          property: InternalObjectProperty.Call,
        }),
      );
      // [classVal]
      sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    });
  }
}
