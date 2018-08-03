import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateConstructArrayHelperOptions {
  readonly body: (options: VisitOptions) => void;
  readonly withoutScope?: boolean;
}

// Input: []
// Output: [farr]
export class CreateConstructArrayHelper extends Helper {
  private readonly body: (options: VisitOptions) => void;
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
      this.body(options);
      // [undefinedVal]
      sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createUndefined);
      sb.emitHelper(node, options, sb.helpers.return);
    };

    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createFunctionArray({
        body: (innerOptions) => {
          if (this.withoutScope) {
            emit(innerOptions);
          } else {
            sb.withScope(node, innerOptions, (options) => {
              emit(options);
            });
          }
        },
      }),
    );
  }
}
