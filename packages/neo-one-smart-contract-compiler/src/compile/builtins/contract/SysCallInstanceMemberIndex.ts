import { SysCallName } from '@neo-one/client-common';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

export class SysCallInstanceMemberIndex extends BuiltinInstanceMemberValue {
  public constructor(
    private readonly syscall: SysCallName,
    private readonly index: number,
    private readonly valueType: WrappableType,
    private readonly type: WrappableType,
  ) {
    super();
  }

  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [blockchainObject]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.valueType }));
    // [index, blockchainObject]
    sb.emitPushInt(node, this.index);
    // [property]
    sb.emitOp(node, 'PICKITEM');
    // [arr]
    sb.emitSysCall(node, this.syscall);
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
