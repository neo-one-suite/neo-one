import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetCachedValueHelperOptions {
  readonly create: (options: VisitOptions) => void;
}

// Input: [keyVal]
// Output: [val]
export class GetCachedValueHelper extends Helper {
  private readonly create: (options: VisitOptions) => void;

  public constructor({ create }: GetCachedValueHelperOptions) {
    super();
    this.create = create;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      // []
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }
    sb.emitHelper(node, options, sb.helpers.binarySerialize);
    // [map, keyVal]
    sb.emitHelper(node, options, sb.helpers.getCache);
    // [map, keyVal, map]
    sb.emitOp(node, 'TUCK');
    // [keyVal, map, keyVal, map]
    sb.emitOp(node, 'OVER');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, keyVal, map]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [val, keyVal, map]
          this.create(options);
          // [val, val, keyVal, map]
          sb.emitOp(node, 'DUP');
          // [map, keyVal, val, val]
          sb.emitOp(node, 'REVERSE4');
          // [val, keyVal, map, val]
          sb.emitOp(node, 'REVERSE3');
          // [val]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );
  }
}
