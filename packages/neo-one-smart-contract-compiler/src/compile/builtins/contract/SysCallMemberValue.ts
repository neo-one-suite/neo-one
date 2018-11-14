import { SysCallName } from '@neo-one/client-common';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberValue } from '../BuiltinMemberValue';
import { MemberLikeExpression } from '../types';

export class SysCallMemberValue extends BuiltinMemberValue {
  public constructor(private readonly syscall: SysCallName, private readonly type: WrappableType) {
    super();
  }

  public emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }
    // [value]
    sb.emitSysCall(node, this.syscall);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
