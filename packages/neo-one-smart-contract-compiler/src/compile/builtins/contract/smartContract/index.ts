import { ContractPropertyName } from '../../../../constants';
import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInstanceMemberStorageProperty } from '../../BuiltinInstanceMemberStorageProperty';
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
  builtins.addContractMember('SmartContract', ContractPropertyName.destroy, new SmartContractDestroy());
};
