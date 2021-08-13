import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

export class BuiltinInstanceIndexValue extends BuiltinInstanceMemberValue {
  public constructor(
    private readonly index: number,
    private readonly valueType: WrappableType,
    private readonly type: WrappableType,
    private readonly shouldWrap: boolean = true,
    private readonly modifier?: (sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions) => void,
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
    if (this.modifier !== undefined) {
      this.modifier(sb, node, options);
    }
    if (this.shouldWrap) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
    }
  }
}
