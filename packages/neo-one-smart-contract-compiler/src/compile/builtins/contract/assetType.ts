import { AssetTypeModel as AssetType } from '@neo-one/client-common';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../BuiltinConstantNumberMemberValue';
import { Builtins } from '../Builtins';

class AssetTypeValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('AssetType', new AssetTypeValue());
  builtins.addContractMember('AssetType', 'Credit', new BuiltinConstantNumberMemberValue(AssetType.CreditFlag));
  builtins.addContractMember('AssetType', 'Duty', new BuiltinConstantNumberMemberValue(AssetType.DutyFlag));
  builtins.addContractMember('AssetType', 'Governing', new BuiltinConstantNumberMemberValue(AssetType.GoverningToken));
  builtins.addContractMember('AssetType', 'Utility', new BuiltinConstantNumberMemberValue(AssetType.UtilityToken));
  builtins.addContractMember('AssetType', 'Currency', new BuiltinConstantNumberMemberValue(AssetType.Currency));
  builtins.addContractMember('AssetType', 'Share', new BuiltinConstantNumberMemberValue(AssetType.Share));
  builtins.addContractMember('AssetType', 'Invoice', new BuiltinConstantNumberMemberValue(AssetType.Invoice));
  builtins.addContractMember('AssetType', 'Token', new BuiltinConstantNumberMemberValue(AssetType.Token));
};
