import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class BooleanInstance extends BuiltinBase {}
class BooleanConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Boolean', new BooleanInstance());
  builtins.addValue(context, 'Boolean', new BooleanInstance());
  builtins.addInterface(context, 'BooleanConstructor', new BooleanConstructor());
};
