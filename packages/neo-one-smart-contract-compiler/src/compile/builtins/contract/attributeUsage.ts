import { AttributeTypeModel } from '@neo-one/client-common';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../BuiltinConstantNumberMemberValue';
import { Builtins } from '../Builtins';

class AttributeTypeValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('AttributeType', new AttributeTypeValue());
  builtins.addContractMember(
    'AttributeType',
    'HighPriority',
    new BuiltinConstantNumberMemberValue(AttributeTypeModel.HighPriority),
  );
  builtins.addContractMember(
    'AttributeType',
    'OracleResponse',
    new BuiltinConstantNumberMemberValue(AttributeTypeModel.OracleResponse),
  );
};
