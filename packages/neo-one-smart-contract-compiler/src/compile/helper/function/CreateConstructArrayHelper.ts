import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateConstructArrayHelperOptions {
  readonly body: (options: VisitOptions) => void;
  readonly withScope: boolean;
}

// Input: []
// Output: [farr]
export class CreateConstructArrayHelper extends Helper {
  private readonly body: (options: VisitOptions) => void;
  private readonly withScope: boolean;

  public constructor({ body, withScope }: CreateConstructArrayHelperOptions) {
    super();
    this.body = body;
    this.withScope = withScope;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, outerOptions: VisitOptions): void {
    if (!outerOptions.pushValue) {
      return;
    }

    const emit = (options: VisitOptions) => {
      // []
      this.body(sb.noPushValueOptions(options));
      // [undefinedVal]
      sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createUndefined);
      // []
      sb.emitHelper(node, options, sb.helpers.return);
    };

    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createFunctionArray({
        body: (innerOptions) => {
          if (this.withScope) {
            sb.withScope(node, innerOptions, (options) => {
              emit(options);
            });
          } else {
            emit(innerOptions);
          }
        },
      }),
    );
  }
}
