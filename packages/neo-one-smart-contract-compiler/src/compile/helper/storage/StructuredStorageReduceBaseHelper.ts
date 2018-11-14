import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface StructuredStorageReduceBaseHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, val]
// Output: [accum]
export class StructuredStorageReduceBaseHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: StructuredStorageReduceBaseHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [val, accum]
    sb.emitOp(node, 'SWAP');
    // [iterator, accum]
    sb.emitHelper(node, options, sb.helpers.createIteratorStructuredStorage({ type: this.type }));
    // [accum, iterator]
    sb.emitOp(node, 'SWAP');
    // [accum]
    sb.emitHelper(node, optionsIn, sb.helpers.rawIteratorReduceBase({ each: this.each }));
  }
}
