import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrRangeHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// Input: [end]
// Output: [arr]
export class ArrRangeHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrRangeHelperOptions) {
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

    // [arr]
    sb.emitOp(node, 'NEWARRAY');
    // [enumerator]
    sb.emitSysCall(node, 'System.Iterator.Create');
    // [number, enumerator]
    sb.emitPushInt(node, 0);
    // [arr, enumerator]
    sb.emitOp(node, 'NEWARRAY');
    // [enumerator, arr]
    sb.emitOp(node, 'SWAP');
    // [number, enumerator, arr]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [enumerator, number, enumerator, arr]
          sb.emitOp(node, 'OVER');
          // [boolean, number, enumerator, arr]
          sb.emitSysCall(node, 'System.Iterator.Next');
        },
        each: (innerOptions) => {
          // [2, number, enumerator, arr]
          sb.emitPushInt(node, 2);
          // [arr, number, enumerator, arr]
          sb.emitOp(node, 'PICK');
          // [number, arr, number, enumerator, arr]
          sb.emitOp(node, 'OVER');
          // tslint:disable-next-line no-map-without-usage
          this.map(innerOptions);
          // [number, enumerator, arr]
          sb.emitOp(node, 'APPEND');
          // [number, enumerator, arr]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [enumerator, arr]
          sb.emitOp(node, 'DROP');
          // [arr]
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
