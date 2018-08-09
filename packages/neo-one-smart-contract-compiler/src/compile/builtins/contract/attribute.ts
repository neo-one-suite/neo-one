import { Types } from '../../helper/types/Types';
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

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('AttributeBase', new AttributeBaseInterface());
  builtins.addContractInterface('AttributeBaseConstructor', new AttributeBaseConstructorInterface());
  builtins.addContractValue('AttributeBase', new ValueInstanceOf((sb) => sb.helpers.isAttribute));
  builtins.addContractMember(
    'AttributeBase',
    'usage',
    new SysCallInstanceMemberPrimitive('Neo.Attribute.GetUsage', Types.Attribute, Types.Number),
  );
  builtins.addContractMember(
    'AttributeBase',
    'data',
    new SysCallInstanceMemberPrimitive('Neo.Attribute.GetData', Types.Attribute, Types.Buffer),
  );
  builtins.addContractInterface('BufferAttribute', new BufferAttributeInterface());
  builtins.addContractInterface('PublicKeyAttribute', new PublicKeyAttributeInterface());
  builtins.addContractInterface('AddressAttribute', new AddressAttributeInterface());
  builtins.addContractInterface('Hash256Attribute', new Hash256AttributeInterface());
};
