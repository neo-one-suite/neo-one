import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

type Process = (options: VisitOptions) => void;

export interface ForType {
  readonly hasType: (type: ts.Type) => boolean;
  readonly isRuntimeType: (options: VisitOptions) => void;
  readonly process: Process;
}

export interface ForTypeHelperOptions {
  readonly type: ts.Type | undefined;
  readonly types: ReadonlyArray<ForType>;
  readonly defaultCase?: (options: VisitOptions) => void;
}

// Input: [val]
// Output: []
export class ForTypeHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly types: ReadonlyArray<ForType>;
  private readonly defaultCase: ((options: VisitOptions) => void) | undefined;

  public constructor({ type, types, defaultCase }: ForTypeHelperOptions) {
    super();
    this.type = type;
    this.types = types;
    this.defaultCase = defaultCase;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const noCastOptions = sb.noCastOptions(optionsIn);
    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    // tslint:disable-next-line no-unnecessary-type-annotation
    const type: ts.Type | undefined = this.type === undefined ? optionsIn.cast : this.type;
    const types = type === undefined ? this.types : this.types.filter((testType) => testType.hasType(type));

    // tslint:disable-next-line readonly-array
    const groupedTypes = new Map<Process, ForType[]>();
    // tslint:disable-next-line no-loop-statement
    for (const forType of types) {
      const mutableTypes = groupedTypes.get(forType.process);
      if (mutableTypes === undefined) {
        groupedTypes.set(forType.process, [forType]);
      } else {
        mutableTypes.push(forType);
      }
    }

    const defaultCase =
      this.defaultCase === undefined
        ? (innerOptions: VisitOptions) => {
            sb.emitOp(node, 'DROP');
            sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
          }
        : this.defaultCase;
    if (types.length === 0) {
      defaultCase(noCastOptions);
    } else if (groupedTypes.size === 1) {
      types[0].process(noCastOptions);
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.case(
          [...groupedTypes.entries()].map(([processType, forTypes]) => ({
            condition: () => {
              // [val, val]
              sb.emitOp(node, 'DUP');
              // [boolean, val]
              forTypes[0].isRuntimeType(options);

              // [boolean, val]
              forTypes.slice(1).forEach((forType) => {
                // [val, boolean, val]
                sb.emitOp(node, 'OVER');
                // [boolean, boolean, val]
                forType.isRuntimeType(options);
                // [boolean, val]
                sb.emitOp(node, 'BOOLOR');
              });
            },
            whenTrue: () => {
              processType(noCastOptions);
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
