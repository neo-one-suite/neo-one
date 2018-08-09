import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinMemberValue } from './BuiltinMemberValue';
import { MemberLikeExpression } from './types';

export class BuiltinConstantBufferMemberValue extends BuiltinMemberValue {
  public constructor(private readonly value: Buffer) {
    super();
  }
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (options.pushValue) {
      // [buffer]
      sb.emitPushBuffer(node, this.value);
      // [bufferVal]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }
}
