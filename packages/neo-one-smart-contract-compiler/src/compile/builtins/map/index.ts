import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { BuiltinNew } from '../BuiltinNew';
import { Builtins } from '../Builtins';
import { Builtin } from '../types';
import { MapDelete } from './delete';
import { MapForEach } from './forEach';
import { MapGet } from './get';
import { MapHas } from './has';
import { MapIterator } from './iterator';
import { MapSet } from './set';
import { MapSize } from './size';

class MapInterface extends BuiltinInterface {}
class ReadonlyMapInterface extends BuiltinInterface {}
class MapValue extends BuiltinNew {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isMap);
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
    sb.emitHelper(node, options, sb.helpers.wrapMap);
  }
}
class MapConstructorInterface extends BuiltinInterface {}

const COMMON: ReadonlyArray<[string, Builtin]> = [
  ['__@iterator', new MapIterator()],
  ['forEach', new MapForEach()],
  ['get', new MapGet()],
  ['has', new MapHas()],
  ['size', new MapSize()],
];

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Map', new MapInterface());
  builtins.addInterface('ReadonlyMap', new ReadonlyMapInterface());
  builtins.addValue('Map', new MapValue());
  COMMON.forEach(([name, builtin]) => {
    builtins.addMember('Map', name, builtin);
    builtins.addMember('ReadonlyMap', name, builtin);
  });
  builtins.addMember('Map', 'delete', new MapDelete());
  builtins.addMember('Map', 'set', new MapSet());
  builtins.addInterface('MapConstructor', new MapConstructorInterface());
};
