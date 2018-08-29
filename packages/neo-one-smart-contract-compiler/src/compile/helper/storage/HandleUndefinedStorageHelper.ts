import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface HandleUndefinedStorageHelperOptions {
  readonly handleUndefined: () => void;
  readonly handleDefined: () => void;
}

// Input: [buffer]
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
          // [buffer, buffer]
          sb.emitOp(node, 'DUP');
          // [number, buffer]
          sb.emitOp(node, 'SIZE');
          // [0, number, buffer]
          sb.emitPushInt(node, 0);
          // [number === 0, buffer]
          sb.emitOp(node, 'NUMEQUAL');
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
