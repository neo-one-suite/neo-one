import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class MapSize extends BuiltinInstanceMemberValue {
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapMap);
    // [number]
    sb.emitOp(node, 'SIZE');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapNumber);
  }
}
