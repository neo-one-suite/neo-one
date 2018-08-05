import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class RegExpInstance extends BuiltinBase {}
class RegExpConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'RegExp', new RegExpInstance());
  builtins.addValue(context, 'RegExp', new RegExpInstance());
  builtins.addInterface(context, 'RegExpConstructor', new RegExpConstructor());
};
