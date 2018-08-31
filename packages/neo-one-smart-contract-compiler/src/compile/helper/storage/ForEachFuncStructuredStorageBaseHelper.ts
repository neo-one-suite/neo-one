import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface ForEachFuncStructuredStorageBaseHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly handleNext: (options: VisitOptions) => void;
}

// Input: [objectVal, val]
// Output: [val]
export class ForEachFuncStructuredStorageBaseHelper extends StructuredStorageBaseHelper {
  private readonly handleNext: (options: VisitOptions) => void;

  public constructor({ handleNext, ...rest }: ForEachFuncStructuredStorageBaseHelperOptions) {
    super(rest);
    this.handleNext = handleNext;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [val, objectVal]
    sb.emitOp(node, 'SWAP');
    // [iterator, objectVal]
    sb.emitHelper(node, options, sb.helpers.createIteratorStructuredStorage({ type: this.type }));
    // [objectVal, iterator]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEachFuncBase({
        handleNext: this.handleNext,
      }),
    );
    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapUndefined);
    }
  }
}
