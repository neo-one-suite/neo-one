import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateIteratorKVIterableIteratorHelperOptions {
  readonly mapKeyValue: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [val]
export class CreateIteratorKVIterableIteratorHelper extends Helper {
  private readonly mapKeyValue: (options: VisitOptions) => void;

  public constructor(options: CreateIteratorKVIterableIteratorHelperOptions) {
    super();
    this.mapKeyValue = options.mapKeyValue;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.createIterableIteratorBase({
        handleNext: (innerOptions) => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [value, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [iterator, value]
          sb.emitOp(node, 'SWAP');
          // [key, value]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [val]
          this.mapKeyValue(innerOptions);
        },
      }),
    );
  }
}
