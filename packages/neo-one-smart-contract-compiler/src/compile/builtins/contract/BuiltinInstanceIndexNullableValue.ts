import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

export class BuiltinInstanceIndexNullableValue extends BuiltinInstanceMemberValue {
  public constructor(
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
    // [nullableVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [property, property]
          sb.emitOp(node, 'DUP');
          // [isnull, property]
          sb.emitOp(node, 'ISNULL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
        whenFalse: () => {
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
        },
      }),
    );
  }
}
