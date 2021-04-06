import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { ValueInstanceOf } from './ValueInstanceOf';

class AttributeBaseInterface extends BuiltinInterface {}
class AttributeBaseConstructorInterface extends BuiltinInterface {}
class HighPriorityAttributeInterface extends BuiltinInterface {}
class OracleResponseAttributeInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('AttributeBase', new AttributeBaseInterface());
  builtins.addContractInterface('AttributeBaseConstructor', new AttributeBaseConstructorInterface());
  builtins.addContractValue(
    'AttributeBase',
    new ValueInstanceOf('AttributeConstructor', (sb) => sb.helpers.isAttribute),
  );
  builtins.addContractInterface('HighPriorityAttribute', new HighPriorityAttributeInterface());
  builtins.addContractInterface('OracleResponseAttribute', new OracleResponseAttributeInterface());
};
