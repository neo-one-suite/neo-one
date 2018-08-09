import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinMemberValue } from './BuiltinMemberValue';
import { MemberLikeExpression } from './types';

export class BuiltinConstantNumberMemberValue extends BuiltinMemberValue {
  public constructor(private readonly value: number) {
    super();
  }
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (options.pushValue) {
      // [buffer]
      sb.emitPushInt(node, this.value);
      // [bufferVal]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    }
  }
}
