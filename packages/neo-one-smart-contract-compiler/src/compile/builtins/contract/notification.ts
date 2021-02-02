import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { ValueInstanceOf } from './ValueInstanceOf';

// class NotificationInterface extends BuiltinInterface {}
// class NotificationConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
// export const add = (builtins: Builtins): void => {
//   builtins.addContractInterface('Notification', new NotificationInterface());
// builtins.addContractValue(
//   'Notification',
//   new ValueInstanceOf('NotificationConstructor', (sb) => sb.helpers.isNotification),
// );
// builtins.addContractInterface('NotificationConstructor', new NotificationConstructorInterface());
// builtins.addContractMember(
//   'Notification',
//   'scriptHash',
//   new BuiltinInstanceIndexValue(0, Types.Notification, Types.Buffer),
// );
// builtins.addContractMember(
//   'Notification',
//   'eventName',
//   new BuiltinInstanceIndexValue(1, Types.Notification, Types.String),
// );
// TODO: need to create another builtin here to handle the stackitems?
// Look for other instances in old code where there was a nested array
// Look for other instances where the output was a generic stackitem?
// What if we only did this for transfer notifications? Then we could assume what the
// array is made up of without guessing types. We can do ISNULL to handle possible nulls
// could also do SIZE to get array size
// Use ISTYPE opcode
// builtins.addContractMember(
//   'Notification',
//   'state',
//   // TODO: Need to see how SysCallInstanceMemberArray handles the array part and integrate into index value one
//   new BuiltinInstanceIndexValue(2, Types.Notification, Types.StackItem),
// );
// };
