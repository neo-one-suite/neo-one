import { SysCallName } from '@neo-one/client-core';
import { WrappableType } from '../../helper/types/Types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

export class SysCallInstanceMemberPrimitive extends BuiltinInstanceMemberValue {
  public constructor(
    private readonly syscall: SysCallName,
    private readonly valueType: WrappableType,
    private readonly type: WrappableType,
  ) {
    super();
  }

  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [blockchainObject]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.valueType }));
    // [value]
    sb.emitSysCall(node, this.syscall);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
