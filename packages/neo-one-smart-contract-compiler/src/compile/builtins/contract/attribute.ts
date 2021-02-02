import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueInstanceOf } from './ValueInstanceOf';

class AttributeBaseInterface extends BuiltinInterface {}
class AttributeBaseConstructorInterface extends BuiltinInterface {}
class BufferAttributeInterface extends BuiltinInterface {}
class PublicKeyAttributeInterface extends BuiltinInterface {}
class AddressAttributeInterface extends BuiltinInterface {}
class Hash256AttributeInterface extends BuiltinInterface {}

// TODO: revisit if NEO implements a usage for these again
// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {};
