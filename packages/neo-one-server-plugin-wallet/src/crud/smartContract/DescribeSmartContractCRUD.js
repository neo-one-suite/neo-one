/* @flow */
import {
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  DescribeCRUD,
} from '@neo-one/server-plugin';

import type SmartContractResourceType, {
  SmartContract,
  SmartContractResourceOptions,
} from '../../SmartContractResourceType';

import common from './common';

export default class DescribeSmartContractCRUD extends DescribeCRUD<
  SmartContract,
  SmartContractResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: SmartContractResourceType |}) {
    super({
      resourceType,
      options: common.options,
    });
  }

  getCLIName(
    options: GetCLINameOptions<SmartContractResourceOptions>,
  ): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIResourceOptions(
    options: GetCLIResourceOptions,
  ): Promise<SmartContractResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
