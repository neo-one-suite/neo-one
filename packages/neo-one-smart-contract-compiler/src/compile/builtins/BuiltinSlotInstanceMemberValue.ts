import { WrappableType } from '../constants';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberValue } from './BuiltinInstanceMemberValue';
import { MemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export class BuiltinSlotInstanceMemberValue extends BuiltinInstanceMemberValue {
  public constructor(private readonly type: WrappableType, private readonly slot: number) {
    super();
  }

  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [number, map]
    sb.emitPushInt(node, this.slot);
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
