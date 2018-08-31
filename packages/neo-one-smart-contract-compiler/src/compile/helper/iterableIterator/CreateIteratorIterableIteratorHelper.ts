import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateIteratorIterableIteratorHelperOptions {
  readonly mapKey?: (options: VisitOptions) => void;
  readonly mapValue?: (options: VisitOptions) => void;
}

const doNothing = () => {
  // do nothing
};

// Input: [iterator]
// Output: [val]
export class CreateIteratorIterableIteratorHelper extends Helper {
  private readonly mapKey: (options: VisitOptions) => void;
  private readonly mapValue: (options: VisitOptions) => void;

  public constructor(options: CreateIteratorIterableIteratorHelperOptions) {
    super();
    this.mapKey = options.mapKey === undefined ? doNothing : options.mapKey;
    this.mapValue = options.mapValue === undefined ? doNothing : options.mapValue;
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
          // [valueVal, iterator]
          this.mapValue(innerOptions);
          // [iterator, valueVal]
          sb.emitOp(node, 'SWAP');
          // [key, valueVal]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [keyVal, valueVal]
          this.mapKey(innerOptions);
          // [number, keyVal, valueVal]
          sb.emitPushInt(node, 2);
          // [arr]
          sb.emitOp(node, 'PACK');
          // [val]
          sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
        },
      }),
    );
  }
}
