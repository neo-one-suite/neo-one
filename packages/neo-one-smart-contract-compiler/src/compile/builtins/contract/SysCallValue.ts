import { SysCallName } from '@neo-one/client-common';
import ts from 'typescript';
import { WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinValue } from '../BuiltinValue';

export class SysCallValue extends BuiltinValue {
  public constructor(private readonly syscall: SysCallName, private readonly type: WrappableType) {
    super();
  }

  public emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }
    // [value]
    sb.emitSysCall(node, this.syscall);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
