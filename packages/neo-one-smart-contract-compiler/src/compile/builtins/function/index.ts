import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class FunctionInstance extends BuiltinBase {}
class FunctionConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Function', new FunctionInstance());
  builtins.addValue(context, 'Function', new FunctionInstance());
  builtins.addInterface(context, 'FunctionConstructor', new FunctionConstructor());
};
