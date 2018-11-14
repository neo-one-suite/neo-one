import { getTypeFromStructuredStorageType, StructuredStorageType } from '../constants';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberValue, BuiltinType, MemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export class BuiltinInstanceMemberStructuredStorageProperty implements BuiltinInstanceMemberValue {
  public readonly types = new Set([BuiltinType.InstanceMemberValue]);

  public constructor(private readonly type: StructuredStorageType, private readonly property: string) {}

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    if (options.pushValue) {
      // [val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createStructuredStorage({
          type: getTypeFromStructuredStorageType(this.type),
          prefix: this.property,
        }),
      );
    }
  }
}
