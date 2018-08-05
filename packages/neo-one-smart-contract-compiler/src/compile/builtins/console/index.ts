import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';
import { ConsoleLog } from './log';

class ConsoleValue extends BuiltinBase {}
class ConsoleType extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Console', new ConsoleType());
  builtins.addMember(context, 'Console', 'log', new ConsoleLog());
  builtins.addValue(context, 'console', new ConsoleValue());
};
