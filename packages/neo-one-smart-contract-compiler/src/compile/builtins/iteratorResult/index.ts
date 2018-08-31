import { IteratorResultSlots, Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinSlotInstanceMemberValue } from '../BuiltinSlotInstanceMemberValue';

class IteratorResultInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('IteratorResult', new IteratorResultInterface());
  builtins.addMember(
    'IteratorResult',
    'done',
    new BuiltinSlotInstanceMemberValue(Types.IteratorResult, IteratorResultSlots.done),
  );
  builtins.addMember(
    'IteratorResult',
    'value',
    new BuiltinSlotInstanceMemberValue(Types.IteratorResult, IteratorResultSlots.value),
  );
};
