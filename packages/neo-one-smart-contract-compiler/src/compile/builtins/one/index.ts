import { BuiltinBase } from '../BuiltinBase';
import { Builtins } from '../Builtins';

class One0Value extends BuiltinBase {}
class One1Value extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addValue('one0', new One0Value());
  builtins.addValue('one1', new One1Value());
};
