import { DescribeCRUD, GetCLINameOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import {
  SmartContract,
  SmartContractResourceOptions,
  SmartContractResourceType,
} from '../../SmartContractResourceType';
import { common } from './common';

export class DescribeSmartContractCRUD extends DescribeCRUD<SmartContract, SmartContractResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: SmartContractResourceType }) {
    super({
      resourceType,
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
