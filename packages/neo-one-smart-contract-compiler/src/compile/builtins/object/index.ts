import { Context } from '../../../Context';
import { Builtins } from '../Builtins';
import { BuiltinBase } from '../types';
import { ObjectKeys } from './keys';

class ObjectInstance extends BuiltinBase {}
class ObjectConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Object', new ObjectInstance());
  builtins.addValue(context, 'Object', new ObjectInstance());
  builtins.addInterface(context, 'ObjectConstructor', new ObjectConstructor());
  builtins.addMember(context, 'ObjectConstructor', 'keys', new ObjectKeys());
};
