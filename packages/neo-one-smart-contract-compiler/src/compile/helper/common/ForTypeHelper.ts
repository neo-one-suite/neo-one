import { Node, Type } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ForType {
  isType: (type?: Type) => boolean;
  isRuntimeType: (options: VisitOptions) => void;
  process: (options: VisitOptions) => void;
}

export interface ForTypeHelperOptions {
  types: ForType[];
  defaultCase?: (options: VisitOptions) => void;
}

// Input: [val]
// Output: []
export class ForTypeHelper extends Helper {
  private readonly types: ForType[];
  private readonly defaultCase: ((options: VisitOptions) => void) | undefined;

  constructor({ types, defaultCase }: ForTypeHelperOptions) {
    super();
    this.types = types;
    this.defaultCase = defaultCase;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const noCastOptions = sb.noCastOptions(optionsIn);
    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    let type = optionsIn.cast;
    if (type == null) {
      type = sb.getType(node);
    }

    const types = this.types.filter((testType) => testType.isType(type));
    const defaultCase =
      this.defaultCase ||
      ((innerOptions) => {
        sb.emitOp(node, 'DROP');
        sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
      });
    if (types.length === 0) {
      defaultCase(noCastOptions);
    } else if (types.length === 1) {
      types[0].process(noCastOptions);
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.case(
          types.map((forType) => ({
            condition: () => {
              sb.emitOp(node, 'DUP');
              forType.isRuntimeType(options);
            },
            whenTrue: () => {
              forType.process(noCastOptions);
            },
          })),
          () => {
            defaultCase(noCastOptions);
          },
        ),
      );
    }
  }
}
