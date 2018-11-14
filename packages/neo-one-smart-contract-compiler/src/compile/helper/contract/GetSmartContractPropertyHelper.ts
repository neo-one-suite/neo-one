import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface GetSmartContractPropertyHelperOptions {
  readonly property: ts.PropertyDeclaration;
}

// Input: []
// Output: []
export class GetSmartContractPropertyHelper extends Helper {
  private readonly property: ts.PropertyDeclaration;

  public constructor({ property }: GetSmartContractPropertyHelperOptions) {
    super();
    this.property = property;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }

    const initializer = tsUtils.initializer.getInitializer(this.property);
    if (initializer === undefined) {
      return;
    }

    const name = tsUtils.node.getName(this.property);
    // [string]
    sb.emitPushString(node, name);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapString);
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.getCachedValue({
        create: (innerOptions) => {
          // [val]
          sb.visit(initializer, innerOptions);
        },
      }),
    );
  }
}
