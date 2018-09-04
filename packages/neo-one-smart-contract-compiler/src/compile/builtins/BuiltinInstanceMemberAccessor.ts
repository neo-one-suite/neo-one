import { tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberValue, BuiltinType, MemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export class BuiltinInstanceMemberAccessor implements BuiltinInstanceMemberValue {
  public readonly types = new Set([BuiltinType.InstanceMemberValue]);

  public constructor(
    private readonly getter?: ts.GetAccessorDeclaration,
    private readonly setter?: ts.SetAccessorDeclaration,
  ) {}

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    const { getter, setter } = this;
    if (options.setValue && setter !== undefined) {
      // [1, val]
      sb.emitPushInt(setter, 1);
      // [argsarr]
      sb.emitOp(setter, 'PACK');
      // []
      sb.withScope(setter, options, (innerOptions) => {
        sb.emitHelper(
          setter,
          sb.pushValueOptions(innerOptions),
          sb.helpers.parameters({
            params: tsUtils.parametered.getParameters(setter),
          }),
        );
        // []
        sb.emitHelper(setter, innerOptions, sb.helpers.invokeSmartContractMethod({ method: setter }));
      });
    }

    if (options.pushValue && getter !== undefined) {
      // [val]
      sb.emitHelper(getter, options, sb.helpers.invokeSmartContractMethod({ method: getter }));
    }
  }
}
