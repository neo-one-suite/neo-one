import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';

class TemplateStringsArrayInstance extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'TemplateStringsArray', new TemplateStringsArrayInstance());
};
