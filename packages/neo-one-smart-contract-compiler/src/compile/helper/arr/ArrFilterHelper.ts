import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrFilterHelperOptions {
  readonly map: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [arr]
// Output: [arr]
export class ArrFilterHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrFilterHelperOptions) {
    super();
    this.map = options.map;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const handleResult = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.if({
          condition: () => {
            // [boolean, accum, val]
            // tslint:disable-next-line no-map-without-usage
            this.map(innerOptions);
          },
          whenTrue: () => {
            // [accum, val, accum]
            sb.emitOp(node, 'TUCK');
            // [val, accum, accum]
            sb.emitOp(node, 'SWAP');
            // [accum]
            sb.emitOp(node, 'APPEND');
          },
          whenFalse: () => {
            // [accum]
            sb.emitOp(node, 'NIP');
          },
        }),
      );
    };

    // [map]
    sb.emitHelper(node, options, sb.helpers.arrToMap);
    if (this.withIndex) {
      // [iterator]
      sb.emitSysCall(node, 'System.Iterator.Create');
      // [0, iterator]
      sb.emitPushInt(node, 0);
      // [accum, iterator]
      sb.emitOp(node, 'NEWARRAY');
      // [accum]
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawIteratorReduce({
          each: (innerOptions) => {
            // [val, accum, idx]
            sb.emitOp(node, 'ROT');
            // [val, accum, val, idx]
            sb.emitOp(node, 'TUCK');
            // [3, val, accum, val, idx]
            sb.emitPushInt(node, 3);
            // [idx, val, accum, val]
            sb.emitOp(node, 'ROLL');
            // [val, idx, accum, val]
            sb.emitOp(node, 'SWAP');
            // [accum]
            handleResult(innerOptions);
          },
        }),
      );
    } else {
      // [enumerator]
      sb.emitSysCall(node, 'System.Iterator.Create');
      // [0, enumerator]
      sb.emitPushInt(node, 0);
      // [accum, enumerator]
      sb.emitOp(node, 'NEWARRAY');
      // [accum]
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawEnumeratorReduce({
          each: (innerOptions) => {
            // [val, accum, val]
            sb.emitOp(node, 'OVER');
            // [accum]
            handleResult(innerOptions);
          },
        }),
      );
    }
  }
}
