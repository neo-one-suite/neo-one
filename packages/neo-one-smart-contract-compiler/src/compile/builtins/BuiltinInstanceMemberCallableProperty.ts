import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import {
  BuiltinInstanceMemberCall,
  BuiltinInstanceMemberValue,
  BuiltinType,
  CallMemberLikeExpression,
  MemberLikeExpression,
} from './types';

// tslint:disable-next-line export-name
export class BuiltinInstanceMemberCallableProperty implements BuiltinInstanceMemberValue, BuiltinInstanceMemberCall {
  public readonly types = new Set([BuiltinType.InstanceMemberValue, BuiltinType.InstanceMemberCall]);

  public constructor(private readonly property: ts.PropertyDeclaration) {}

  public canCall(): boolean {
    return true;
  }

  public emitCall(
    sb: ScriptBuilder,
    _func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);

    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    // [argsarr]
    sb.emitHelper(node, options, sb.helpers.args);
    // [val, argsarr]
    sb.emitHelper(node, options, sb.helpers.getSmartContractProperty({ property: this.property }));
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.invokeCall({ bindThis: false }));
  }

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    if (options.setValue) {
      sb.context.reportUnsupported(node);
    }

    if (options.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.getSmartContractProperty({ property: this.property }));
    }
  }
}
