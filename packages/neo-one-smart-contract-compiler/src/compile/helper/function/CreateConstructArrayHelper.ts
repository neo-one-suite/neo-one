import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateConstructArrayHelperOptions {
  readonly body: () => void;
  readonly withoutScope?: boolean;
}

// Input: []
// Output: [farr]
export class CreateConstructArrayHelper extends Helper {
  private readonly body: () => void;
  private readonly withoutScope: boolean;

  public constructor({ body, withoutScope }: CreateConstructArrayHelperOptions) {
    super();
    this.body = body;
    this.withoutScope = withoutScope || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, outerOptions: VisitOptions): void {
    if (!outerOptions.pushValue) {
      return;
    }

    const emit = (options: VisitOptions) => {
      // []
      this.body();
      // [undefinedVal]
      sb.emitHelper(node, options, sb.helpers.createUndefined);
      // [completion]
      sb.emitHelper(node, options, sb.helpers.createNormalCompletion);
      // [completion]
      sb.emitOp(node, 'RET');
    };

    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createFunctionArray({
        body: () => {
          if (this.withoutScope) {
            emit(outerOptions);
          } else {
            sb.withScope(node, outerOptions, (options) => {
              emit(options);
            });
          }
        },
      }),
    );
  }
}
