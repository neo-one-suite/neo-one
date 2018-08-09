import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayLength extends BuiltinInstanceMemberValue {
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [number]
    sb.emitHelper(node, options, sb.helpers.arrayLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapNumber);
  }
}
