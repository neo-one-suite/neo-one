import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface HandleUndefinedStorageHelperOptions {
  readonly handleUndefined: () => void;
  readonly handleDefined: () => void;
}

// Input: [value]
// Output: [value]
export class HandleUndefinedStorageHelper extends Helper {
  private readonly handleUndefined: () => void;
  private readonly handleDefined: () => void;

  public constructor({ handleUndefined, handleDefined }: HandleUndefinedStorageHelperOptions) {
    super();
    this.handleUndefined = handleUndefined;
    this.handleDefined = handleDefined;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [value, value]
          sb.emitOp(node, 'DUP');
          // [buffer, value, value]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          this.handleUndefined();
        },
        whenFalse: () => {
          this.handleDefined();
        },
      }),
    );
  }
}
