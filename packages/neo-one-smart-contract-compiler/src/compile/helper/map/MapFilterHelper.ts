import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapFilterHelperOptions {
  readonly map: (options: VisitOptions) => void;
}

// Input: [map]
// Output: [map]
export class MapFilterHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: MapFilterHelperOptions) {
    super();
    this.map = options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }
    // [iterator]
    sb.emitSysCall(node, 'Neo.Iterator.Create');
    // [accum, iterator]
    sb.emitOp(node, 'NEWMAP');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduce({
        each: (innerOptions) => {
          // [value, accum, key]
          sb.emitOp(node, 'ROT');
          // [key, value, accum]
          sb.emitOp(node, 'ROT');
          // [key, val, key, accum]
          sb.emitOp(node, 'TUCK');
          // [val, key, val, key, accum]
          sb.emitOp(node, 'OVER');
          // [key, val, val, key, accum]
          sb.emitOp(node, 'SWAP');
          // [accum]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [boolean, val, key, accum]
                // tslint:disable-next-line no-map-without-usage
                this.map(innerOptions);
              },
              whenTrue: () => {
                // [accum, val, key]
                sb.emitOp(node, 'ROT');
                // [3, accum, val, key]
                sb.emitPushInt(node, 3);
                // [accum, val, key, accum]
                sb.emitOp(node, 'XTUCK');
                // [key, accum, val, accum]
                sb.emitOp(node, 'ROT');
                // [val, key, accum, accum]
                sb.emitOp(node, 'ROT');
                // [accum]
                sb.emitOp(node, 'SETITEM');
              },
              whenFalse: () => {
                // [key, accum]
                sb.emitOp(node, 'DROP');
                // [accum]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
        },
      }),
    );
  }
}
