import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class NumberInstance extends BuiltinBase {}
class NumberConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Number', new NumberInstance());
  builtins.addValue(context, 'Number', new NumberInstance());
  builtins.addInterface(context, 'NumberConstructor', new NumberConstructor());
};
