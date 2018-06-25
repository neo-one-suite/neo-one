import { Node, Type } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ForType {
  readonly hasType: (type?: Type) => boolean;
  readonly isRuntimeType: (options: VisitOptions) => void;
  readonly process: (options: VisitOptions) => void;
}

export interface ForTypeHelperOptions {
  readonly type: Type | undefined;
  readonly types: ReadonlyArray<ForType>;
  readonly defaultCase?: (options: VisitOptions) => void;
}

// Input: [val]
// Output: []
export class ForTypeHelper extends Helper {
  private readonly type: Type | undefined;
  private readonly types: ReadonlyArray<ForType>;
  private readonly defaultCase: ((options: VisitOptions) => void) | undefined;

  public constructor({ type, types, defaultCase }: ForTypeHelperOptions) {
    super();
    this.type = type;
    this.types = types;
    this.defaultCase = defaultCase;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const noCastOptions = sb.noCastOptions(optionsIn);
    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    const type = this.type === undefined ? optionsIn.cast : this.type;
    const types = this.types.filter((testType) => testType.hasType(type));
    const defaultCase =
      this.defaultCase === undefined
        ? (innerOptions: VisitOptions) => {
            sb.emitOp(node, 'DROP');
            sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
          }
        : this.defaultCase;
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
