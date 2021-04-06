import ts from 'typescript';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberValue } from '../BuiltinInstanceMemberValue';
import { MemberLikeExpression } from '../types';

export class InstanceMemberWithScript extends BuiltinInstanceMemberValue {
  public constructor(
    private readonly script: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void,
    private readonly valueType: WrappableType,
    private readonly type: WrappableType,
  ) {
    super();
  }

  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    // [blockchainObject]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.valueType }));
    // [val]
    this.script(sb, node, options);
    // [valVal]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
