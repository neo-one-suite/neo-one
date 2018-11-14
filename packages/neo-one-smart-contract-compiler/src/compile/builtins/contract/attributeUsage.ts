import { AttributeUsageModel as AttributeUsage } from '@neo-one/client-common';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../BuiltinConstantNumberMemberValue';
import { Builtins } from '../Builtins';

class AttributeUsageValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('AttributeUsage', new AttributeUsageValue());
  builtins.addContractMember(
    'AttributeUsage',
    'ContractHash',
    new BuiltinConstantNumberMemberValue(AttributeUsage.ContractHash),
  );
  builtins.addContractMember('AttributeUsage', 'ECDH02', new BuiltinConstantNumberMemberValue(AttributeUsage.ECDH02));
  builtins.addContractMember('AttributeUsage', 'ECDH03', new BuiltinConstantNumberMemberValue(AttributeUsage.ECDH03));
  builtins.addContractMember('AttributeUsage', 'Script', new BuiltinConstantNumberMemberValue(AttributeUsage.Script));
  builtins.addContractMember('AttributeUsage', 'Vote', new BuiltinConstantNumberMemberValue(AttributeUsage.Vote));
  builtins.addContractMember(
    'AttributeUsage',
    'DescriptionUrl',
    new BuiltinConstantNumberMemberValue(AttributeUsage.DescriptionUrl),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Description',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Description),
  );
  builtins.addContractMember('AttributeUsage', 'Hash1', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash1));
  builtins.addContractMember('AttributeUsage', 'Hash2', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash2));
  builtins.addContractMember('AttributeUsage', 'Hash3', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash3));
  builtins.addContractMember('AttributeUsage', 'Hash4', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash4));
  builtins.addContractMember('AttributeUsage', 'Hash5', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash5));
  builtins.addContractMember('AttributeUsage', 'Hash6', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash6));
  builtins.addContractMember('AttributeUsage', 'Hash7', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash7));
  builtins.addContractMember('AttributeUsage', 'Hash8', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash8));
  builtins.addContractMember('AttributeUsage', 'Hash9', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash9));
  builtins.addContractMember('AttributeUsage', 'Hash10', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash10));
  builtins.addContractMember('AttributeUsage', 'Hash11', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash11));
  builtins.addContractMember('AttributeUsage', 'Hash12', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash12));
  builtins.addContractMember('AttributeUsage', 'Hash13', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash13));
  builtins.addContractMember('AttributeUsage', 'Hash14', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash14));
  builtins.addContractMember('AttributeUsage', 'Hash15', new BuiltinConstantNumberMemberValue(AttributeUsage.Hash15));
  builtins.addContractMember('AttributeUsage', 'Remark', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark));
  builtins.addContractMember('AttributeUsage', 'Remark1', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark1));
  builtins.addContractMember('AttributeUsage', 'Remark2', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark2));
  builtins.addContractMember('AttributeUsage', 'Remark3', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark3));
  builtins.addContractMember('AttributeUsage', 'Remark4', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark4));
  builtins.addContractMember('AttributeUsage', 'Remark5', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark5));
  builtins.addContractMember('AttributeUsage', 'Remark6', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark6));
  builtins.addContractMember('AttributeUsage', 'Remark7', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark7));
  builtins.addContractMember('AttributeUsage', 'Remark8', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark8));
  builtins.addContractMember('AttributeUsage', 'Remark9', new BuiltinConstantNumberMemberValue(AttributeUsage.Remark9));
  builtins.addContractMember(
    'AttributeUsage',
    'Remark10',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark10),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Remark11',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark11),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Remark12',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark12),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Remark13',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark13),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Remark14',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark14),
  );
  builtins.addContractMember(
    'AttributeUsage',
    'Remark15',
    new BuiltinConstantNumberMemberValue(AttributeUsage.Remark15),
  );
};
