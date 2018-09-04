import { IterableIteratorSlots, Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinSlotInstanceMemberCall } from '../BuiltinSlotInstanceMemberCall';

class IterableIteratorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('IterableIterator', new IterableIteratorInterface());
  builtins.addGlobalMember(
    'Iterator',
    'next',
    new BuiltinSlotInstanceMemberCall(Types.IterableIterator, IterableIteratorSlots.next),
  );
  builtins.addGlobalMember(
    'IterableIterator',
    '__@iterator',
    new BuiltinSlotInstanceMemberCall(Types.IterableIterator, IterableIteratorSlots.iterator),
  );
};
