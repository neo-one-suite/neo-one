import { ContractPropertyName } from '../../../../constants';
import { StructuredStorageType } from '../../../constants';
import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInstanceMemberStorageProperty } from '../../BuiltinInstanceMemberStorageProperty';
import { BuiltinInstanceMemberStructuredStorageProperty } from '../../BuiltinInstanceMemberStructuredStorageProperty';
import { Builtins } from '../../Builtins';
import { SmartContractAddress } from './address';
import { SmartContractDestroy } from './destroy';
import { SmartContractFor } from './for';

class SmartContractValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('SmartContract', new SmartContractValue());
  builtins.addContractMember('SmartContract', 'for', new SmartContractFor());
  builtins.addContractMember('SmartContract', ContractPropertyName.address, new SmartContractAddress());
  builtins.addContractMember(
    'SmartContract',
    ContractPropertyName.deployed,
    new BuiltinInstanceMemberStorageProperty(ContractPropertyName.deployed),
  );
  builtins.addContractMember(
    'SmartContract',
    ContractPropertyName.processedTransactions,
    new BuiltinInstanceMemberStructuredStorageProperty(
      StructuredStorageType.SetStorage,
      ContractPropertyName.processedTransactions,
    ),
  );
  builtins.addContractMember(
    'SmartContract',
    ContractPropertyName.claimedTransactions,
    new BuiltinInstanceMemberStructuredStorageProperty(
      StructuredStorageType.MapStorage,
      ContractPropertyName.claimedTransactions,
    ),
  );
  builtins.addContractMember('SmartContract', ContractPropertyName.destroy, new SmartContractDestroy());
};
