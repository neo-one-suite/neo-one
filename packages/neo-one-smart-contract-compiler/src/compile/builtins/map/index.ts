import ts from 'typescript';
import { Context } from '../../../Context';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Builtins } from '../Builtins';
import { BuiltinBase, BuiltinType, BuiltinValue } from '../types';

class MapInstance extends BuiltinBase implements BuiltinValue {
  public readonly canImplement = true;
  public readonly types = new Set([BuiltinType.Value]);

  public emitValue(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getMapClass);
  }
}
class MapConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Map', new MapInstance());
  builtins.addValue(context, 'Map', new MapInstance());
  builtins.addInterface(context, 'MapConstructor', new MapConstructor());
};
