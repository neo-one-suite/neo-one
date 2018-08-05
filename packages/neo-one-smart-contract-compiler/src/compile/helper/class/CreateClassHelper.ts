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
  readonly prototypeSymbolMethods?: Properties;
  readonly classMethods?: Properties;
  readonly classSymbolMethods?: Properties;
}

// Input: []
// Output: [classVal]
export class CreateClassHelper extends Helper {
  private readonly ctor?: (options: VisitOptions) => void;
  private readonly prototypeMethods: Properties;
  private readonly prototypeSymbolMethods: Properties;
  private readonly classMethods: Properties;
  private readonly classSymbolMethods: Properties;

  public constructor(options: CreateClassHelperOptions) {
    super();
    this.ctor = options.ctor;
    this.prototypeMethods = options.prototypeMethods === undefined ? {} : options.prototypeMethods;
    this.prototypeSymbolMethods = options.prototypeSymbolMethods === undefined ? {} : options.prototypeSymbolMethods;
    this.classMethods = options.classMethods === undefined ? {} : options.classMethods;
    this.classSymbolMethods = options.classSymbolMethods === undefined ? {} : options.classSymbolMethods;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const createMethod = (body: Prop) => {
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
    };

    const createPropertyMethod = (name: string, body: Prop) => {
      // [prototypeVal, prototypeVal]
      sb.emitOp(node, 'DUP');
      // [name, prototypeVal, prototypeVal]
      sb.emitPushString(node, name);
      // [fObjectVal, name, prototypeVal, prototypeVal]
      createMethod(body);
      // [prototypeVal]
      sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    };

    const createSymbolMethod = (name: string, body: Prop) => {
      // [prototypeVal, prototypeVal]
      sb.emitOp(node, 'DUP');
      // [name, prototypeVal, prototypeVal]
      sb.emitPushString(node, name);
      // [fObjectVal, name, prototypeVal, prototypeVal]
      createMethod(body);
      // [prototypeVal]
      sb.emitHelper(node, options, sb.helpers.setDataSymbolObjectProperty);
    };

    // create prototype
    // [prototypeVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [prototypeVal]
    Object.entries(this.prototypeMethods).forEach(([name, body]) => {
      createPropertyMethod(name, body);
    });
    // [prototypeVal]
    Object.entries(this.prototypeSymbolMethods).forEach(([name, body]) => {
      createSymbolMethod(name, body);
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
      createPropertyMethod(name, body);
    });
    // [classVal]
    Object.entries(this.classSymbolMethods).forEach(([name, body]) => {
      createSymbolMethod(name, body);
    });
  }
}
