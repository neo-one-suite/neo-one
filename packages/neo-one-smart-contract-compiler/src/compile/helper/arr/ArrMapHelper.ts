import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrMapHelperOptions {
  readonly map: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [arr]
// Output: [arr]
export class ArrMapHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrMapHelperOptions) {
    super();
    this.map = options.map;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map]
    sb.emitHelper(node, options, sb.helpers.arrToMap);
    if (this.withIndex) {
      // [iterator]
      sb.emitHelper(node, options, sb.helpers.createMapIterator);
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
            // [idx, val, accum]
            sb.emitOp(node, 'ROT');
            // [val, idx, accum]
            sb.emitOp(node, 'SWAP');
            // [val, accum]
            // tslint:disable-next-line no-map-without-usage
            this.map(innerOptions);
            // [accum, val, accum]
            sb.emitOp(node, 'OVER');
            // [val, accum, accum]
            sb.emitOp(node, 'SWAP');
            // [accum]
            sb.emitOp(node, 'APPEND');
          },
        }),
      );
    } else {
      // [enumerator]
      sb.emitHelper(node, options, sb.helpers.createMapIterator);
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
            // [accum, val, accum]
            sb.emitOp(node, 'TUCK');
            // [val, accum, accum]
            sb.emitOp(node, 'SWAP');
            // [val, accum, accum]
            // tslint:disable-next-line no-map-without-usage
            this.map(innerOptions);
            // [accum]
            sb.emitOp(node, 'APPEND');
          },
        }),
      );
    }
  }
}
