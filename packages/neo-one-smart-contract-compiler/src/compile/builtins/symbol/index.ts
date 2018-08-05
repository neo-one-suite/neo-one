import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';
import { SymbolFor } from './for';
import { SymbolIterator } from './iterator';
import { SymbolToPrimitive } from './toPrimitive';

class SymbolInstance extends BuiltinBase {}
class SymbolConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Symbol', new SymbolInstance());
  builtins.addValue(context, 'Symbol', new SymbolInstance());
  builtins.addInterface(context, 'SymbolConstructor', new SymbolConstructor());
  builtins.addMember(context, 'SymbolConstructor', 'for', new SymbolFor());
  builtins.addMember(context, 'SymbolConstructor', 'iterator', new SymbolIterator());
  builtins.addMember(context, 'SymbolConstructor', 'toPrimitive', new SymbolToPrimitive());
};
