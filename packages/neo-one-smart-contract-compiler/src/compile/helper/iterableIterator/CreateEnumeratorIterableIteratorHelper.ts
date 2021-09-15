import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateEnumeratorIterableIteratorHelperOptions {
  readonly deserializeKey?: boolean;
  readonly mapValue?: (options: VisitOptions) => void;
}

const doNothing = () => {
  // do nothing
};

// Input: [enumerator]
// Output: [val]
export class CreateEnumeratorIterableIteratorHelper extends Helper {
  private readonly deserializeKey: boolean;
  private readonly mapValue: (options: VisitOptions) => void;

  public constructor(options: CreateEnumeratorIterableIteratorHelperOptions) {
    super();
    this.mapValue = options.mapValue === undefined ? doNothing : options.mapValue;
    this.deserializeKey = options.deserializeKey || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.createIterableIteratorBase({
        handleNext: (innerOptions) => {
          // [value]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          if (this.deserializeKey) {
            // [value]
            sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          }
          // [val]
          this.mapValue(innerOptions);
        },
      }),
    );
  }
}
