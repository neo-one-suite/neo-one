import { CallFlags, UInt160 } from '@neo-one/client-common';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberValue } from '../BuiltinMemberValue';
import { MemberLikeExpression } from '../types';

export class NativeContractCallValue extends BuiltinMemberValue {
  public constructor(
    private readonly method: string,
    private readonly callFlags: CallFlags,
    private readonly hash: UInt160,
    private readonly type: WrappableType,
  ) {
    super();
  }

  public emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }
    // [[]]
    sb.emitOp(node, 'NEWARRAY0');
    // [number, []]
    sb.emitPushInt(node, this.callFlags);
    // [method, number, []]
    sb.emitPushString(node, this.method);
    // [buffer, method, number, []]
    sb.emitPushBuffer(node, this.hash);
    // [val]
    sb.emitSysCall(node, 'System.Contract.Call');
    sb.addMethodToken(this.hash, this.method, 0, true, this.callFlags);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
