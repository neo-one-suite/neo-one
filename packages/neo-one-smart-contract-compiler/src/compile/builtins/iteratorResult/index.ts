import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class IteratorResultInstance extends BuiltinBase {
  public readonly canImplement = true;
}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'IteratorResult', new IteratorResultInstance());
};
