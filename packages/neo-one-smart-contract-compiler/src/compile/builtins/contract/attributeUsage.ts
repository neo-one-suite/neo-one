import { AttributeTypeModel as AttributeUsage } from '@neo-one/client-common';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../BuiltinConstantNumberMemberValue';
import { Builtins } from '../Builtins';

class AttributeUsageValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('AttributeUsage', new AttributeUsageValue());
  builtins.addContractMember(
    'AttributeUsage',
    'HighPriority',
    new BuiltinConstantNumberMemberValue(AttributeUsage.HighPriority),
  );
};
