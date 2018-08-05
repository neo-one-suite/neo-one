import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class StringInstance extends BuiltinBase {}
class StringConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'String', new StringInstance());
  builtins.addValue(context, 'String', new StringInstance());
  builtins.addInterface(context, 'StringConstructor', new StringConstructor());
};
