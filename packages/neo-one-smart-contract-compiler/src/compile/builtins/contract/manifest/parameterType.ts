import { ContractParameterTypeModel as ContractParameterType } from '@neo-one/client-common';
import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../../BuiltinConstantNumberMemberValue';
import { Builtins } from '../../Builtins';

class ContractParameterTypeValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('ContractParameterType', new ContractParameterTypeValue());
  builtins.addContractMember(
    'ContractParameterType',
    'Any',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Any),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Boolean',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Boolean),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Integer',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Integer),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'ByteArray',
    new BuiltinConstantNumberMemberValue(ContractParameterType.ByteArray),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'String',
    new BuiltinConstantNumberMemberValue(ContractParameterType.String),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Hash160',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Hash160),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Hash256',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Hash256),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'PublicKey',
    new BuiltinConstantNumberMemberValue(ContractParameterType.PublicKey),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Signature',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Signature),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Array',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Array),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Map',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Map),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'InteropInterface',
    new BuiltinConstantNumberMemberValue(ContractParameterType.InteropInterface),
  );
  builtins.addContractMember(
    'ContractParameterType',
    'Void',
    new BuiltinConstantNumberMemberValue(ContractParameterType.Void),
  );
};
