import { ContractPropertyName } from '../../../../constants';
import { StructuredStorageType } from '../../../constants';
import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInstanceMemberStructuredStorageProperty } from '../../BuiltinInstanceMemberStructuredStorageProperty';
import { Builtins } from '../../Builtins';
import { SmartContractAddress } from './address';
import { SmartContractFor } from './for';

class SmartContractValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('SmartContract', new SmartContractValue());
  builtins.addContractMember('SmartContract', 'for', new SmartContractFor());
  builtins.addContractMember('SmartContract', 'address', new SmartContractAddress());
  builtins.addContractMember(
    'SmartContract',
    'processedTransactions',
    new BuiltinInstanceMemberStructuredStorageProperty(
      StructuredStorageType.SetStorage,
      ContractPropertyName.processedTransactions,
    ),
  );
  builtins.addContractMember(
    'SmartContract',
    'allowedRefunds',
    new BuiltinInstanceMemberStructuredStorageProperty(
      StructuredStorageType.SetStorage,
      ContractPropertyName.allowedRefunds,
    ),
  );
};
