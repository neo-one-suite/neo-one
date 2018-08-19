import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrSomeHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// Input: [arr]
// Output: [boolean]
export class ArrSomeHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrSomeHelperOptions) {
    super();
    this.map =
      options.map === undefined
        ? () => {
            // do nothing
          }
        : options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [enumerator]
    sb.emitSysCall(node, 'Neo.Enumerator.Create');
    // [result, enumerator]
    sb.emitPushBoolean(node, false);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [result, enumerator, result]
          sb.emitOp(node, 'TUCK');
          // [!result, enumerator, result]
          sb.emitOp(node, 'NOT');
          // [enumerator, !result, enumerator, result]
          sb.emitOp(node, 'OVER');
          // [boolean, !result, enumerator, result]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
          // [boolean, enumerator, result]
          sb.emitOp(node, 'AND');
        },
        each: (innerOptions) => {
          // [enumerator]
          sb.emitOp(node, 'NIP');
          // [enumerator, enumerator]
          sb.emitOp(node, 'DUP');
          // [value, enumerator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [result, enumerator]
          // tslint:disable-next-line no-map-without-usage
          this.map(innerOptions);
        },
      }),
    );
    // [result]
    sb.emitOp(node, 'DROP');
  }
}
