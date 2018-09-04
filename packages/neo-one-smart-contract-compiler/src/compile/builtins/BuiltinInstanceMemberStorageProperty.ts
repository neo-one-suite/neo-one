import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberValue, BuiltinType, MemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export class BuiltinInstanceMemberStorageProperty implements BuiltinInstanceMemberValue {
  public readonly types = new Set([BuiltinType.InstanceMemberValue]);

  public constructor(private readonly property: string) {}

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    if (options.setValue) {
      // [string, val]
      sb.emitPushString(node, this.property);
      // []
      sb.emitHelper(node, options, sb.helpers.putCommonStorage);
    }

    if (options.pushValue) {
      // [string]
      sb.emitPushString(node, this.property);
      // [val]
      sb.emitHelper(node, options, sb.helpers.getCommonStorage);
    }
  }
}
