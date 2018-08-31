import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorFilterHelperOptions {
  readonly filter: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [map]
export class RawIteratorFilterHelper extends Helper {
  private readonly filter: (options: VisitOptions) => void;

  public constructor(options: RawIteratorFilterHelperOptions) {
    super();
    this.filter = options.filter;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [map, iterator]
    sb.emitOp(node, 'NEWMAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [iterator, map, iterator]
          sb.emitOp(node, 'OVER');
          // [boolean, map, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);

          // [iterator, map, iterator]
          sb.emitOp(node, 'OVER');
          // [iterator, iterator, map, iterator]
          sb.emitOp(node, 'DUP');
          // [key, iterator, map, iterator]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [iterator, key, map, iterator]
          sb.emitOp(node, 'SWAP');
          // [value, key, map, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [boolean, map, iterator]
                this.filter(innerOptions);
              },
              whenTrue: () => {
                // [map, iterator, map]
                sb.emitOp(node, 'TUCK');
                // [iterator, map, iterator, map]
                sb.emitOp(node, 'OVER');
                // [iterator, iterator, map, iterator, map]
                sb.emitOp(node, 'DUP');
                // [key, iterator, map, iterator, map]
                sb.emitSysCall(node, 'Neo.Iterator.Key');
                // [iterator, key, map, iterator, map]
                sb.emitOp(node, 'SWAP');
                // [value, key, map, iterator, map]
                sb.emitSysCall(node, 'Neo.Enumerator.Value');
                // [iterator, map]
                sb.emitOp(node, 'SETITEM');
                // [map, iterator]
                sb.emitOp(node, 'SWAP');
              },
            }),
          );
        },
      }),
    );
    // [map]
    sb.emitOp(node, 'NIP');
  }
}
