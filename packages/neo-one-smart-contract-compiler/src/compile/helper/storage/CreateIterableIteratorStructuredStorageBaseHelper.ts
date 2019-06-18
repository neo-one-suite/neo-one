import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface CreateIterableIteratorStructuredStorageBaseHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly handleNext: (options: VisitOptions) => void;
}

// Input: [val]
// Output: [val]
export class CreateIterableIteratorStructuredStorageBaseHelper extends StructuredStorageBaseHelper {
  private readonly handleNext: (options: VisitOptions) => void;

  public constructor({ handleNext, ...rest }: CreateIterableIteratorStructuredStorageBaseHelperOptions) {
    super(rest);
    this.handleNext = handleNext;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [iterator]
    sb.emitHelper(node, options, sb.helpers.createIteratorStructuredStorage({ type: this.type }));
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createIterableIteratorBase({
        handleNext: this.handleNext,
        hasFilter: true,
      }),
    );
  }
}
