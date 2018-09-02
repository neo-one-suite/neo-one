import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { BuiltinNew } from '../BuiltinNew';
import { Builtins } from '../Builtins';
import { MapDelete } from '../map/delete';
import { MapHas } from '../map/has';
import { MapSize } from '../map/size';
import { Builtin } from '../types';
import { SetAdd } from './add';
import { SetForEach } from './forEach';
import { SetIterator } from './iterator';

class SetInterface extends BuiltinInterface {}
class ReadonlySetInterface extends BuiltinInterface {}
class SetValue extends BuiltinNew {
  public readonly type = 'SetConstructor';

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isSet);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }

  public emitNew(sb: ScriptBuilder, node: ts.NewExpression, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }

    // [map]
    sb.emitOp(node, 'NEWMAP');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapSet);
  }
}
class SetConstructorInterface extends BuiltinInterface {}

const COMMON: ReadonlyArray<[string, Builtin]> = [
  ['__@iterator', new SetIterator()],
  ['forEach', new SetForEach()],
  ['has', new MapHas()],
  ['size', new MapSize()],
];

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Set', new SetInterface());
  builtins.addInterface('ReadonlySet', new ReadonlySetInterface());
  builtins.addValue('Set', new SetValue());
  COMMON.forEach(([name, builtin]) => {
    builtins.addMember('Set', name, builtin);
    builtins.addMember('ReadonlySet', name, builtin);
  });
  builtins.addMember('Set', 'delete', new MapDelete());
  builtins.addMember('Set', 'add', new SetAdd());
  builtins.addInterface('SetConstructor', new SetConstructorInterface());
};
