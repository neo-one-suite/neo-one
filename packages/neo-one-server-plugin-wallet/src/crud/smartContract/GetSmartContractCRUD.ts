import { GetCLIResourceOptions, GetCRUD } from '@neo-one/server-plugin';
import {
  SmartContract,
  SmartContractResourceOptions,
  SmartContractResourceType,
} from '../../SmartContractResourceType';
import { common } from './common';

export class GetSmartContractCRUD extends GetCRUD<SmartContract, SmartContractResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: SmartContractResourceType }) {
    super({
      resourceType,
      options: common.options,
    });
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<SmartContractResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
