import { DeleteCRUD, GetCLINameOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import {
  SmartContract,
  SmartContractResourceOptions,
  SmartContractResourceType,
} from '../../SmartContractResourceType';
import { common } from './common';

export class DeleteSmartContractCRUD extends DeleteCRUD<SmartContract, SmartContractResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: SmartContractResourceType }) {
    super({
      resourceType,
      help:
        'Deletes the smart contract called <name>. This only removes ' +
        'the smart contract from NEO•ONE, it will still exist on the blockchain.',
      options: common.options,
    });
  }

  public async getCLIName(options: GetCLINameOptions<SmartContractResourceOptions>): Promise<string> {
    return common.getCLIName(options);
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<SmartContractResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
