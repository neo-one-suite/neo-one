import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { ConsoleLog } from './log';

class ConsoleInterface extends BuiltinInterface {}
class ConsoleValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Console', new ConsoleInterface());
  builtins.addMember('Console', 'log', new ConsoleLog());
  builtins.addValue('console', new ConsoleValue());
};
