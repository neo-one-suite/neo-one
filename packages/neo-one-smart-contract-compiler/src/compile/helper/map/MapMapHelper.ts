import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapMapHelperOptions {
  readonly map: (options: VisitOptions) => void;
}

// Input: [map]
// Output: [map]
export class MapMapHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: MapMapHelperOptions) {
    super();
    this.map = options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [accum, map]
    sb.emitOp(node, 'NEWMAP');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.mapReduceWithoutIterator({
        each: (innerOptions) => {
          // [accum, accum, key, val]
          sb.emitOp(node, 'DUP');
          // [val, key, accum, accum]
          sb.emitOp(node, 'REVERSE4');
          // [accum, key, val, accum]
          sb.emitOp(node, 'REVERSE3');
          // [val, accum, key, accum]
          sb.emitOp(node, 'ROT');
          // [key, val, accum, accum]
          sb.emitOp(node, 'ROT');
          // [key, val, accum, accum]
          // tslint:disable-next-line no-map-without-usage
          this.map(innerOptions);
          // [val, key, accum, accum]
          sb.emitOp(node, 'SWAP');
          // [accum]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );
  }
}
