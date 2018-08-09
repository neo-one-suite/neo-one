import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceOf } from '../BuiltinInstanceOf';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BufferConcat } from './concat';
import { BufferEquals } from './equals';
import { BufferFrom } from './from';
import { BufferLength } from './length';

class BufferInterface extends BuiltinInterface {}
class BufferValue extends BuiltinInstanceOf {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isBuffer);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class BufferConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Buffer', new BufferInterface());
  builtins.addValue('Buffer', new BufferValue());
  builtins.addMember('Buffer', 'equals', new BufferEquals());
  builtins.addMember('Buffer', 'length', new BufferLength());
  builtins.addInterface('BufferConstructor', new BufferConstructorInterface());
  builtins.addMember('BufferConstructor', 'concat', new BufferConcat());
  builtins.addMember('BufferConstructor', 'from', new BufferFrom());
};
