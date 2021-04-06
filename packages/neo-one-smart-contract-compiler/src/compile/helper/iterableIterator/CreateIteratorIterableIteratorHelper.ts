import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateIteratorIterableIteratorHelperOptions {
  readonly deserializeKey?: boolean;
  readonly mapKey?: (options: VisitOptions) => void;
  readonly mapValue?: (options: VisitOptions) => void;
}

const doNothing = () => {
  // do nothing
};

// Input: [iterator]
// Output: [val]
export class CreateIteratorIterableIteratorHelper extends Helper {
  private readonly deserializeKey: boolean;
  private readonly mapKey: (options: VisitOptions) => void;
  private readonly mapValue: (options: VisitOptions) => void;

  public constructor(options: CreateIteratorIterableIteratorHelperOptions) {
    super();
    this.deserializeKey = options.deserializeKey ?? false;
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
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [valueVal, iterator]
          this.mapValue(innerOptions);
          // [iterator, valueVal]
          sb.emitOp(node, 'SWAP');
          // [key, valueVal]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorKey);
          if (this.deserializeKey) {
            // [key, valueVal]
            sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
          }
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
