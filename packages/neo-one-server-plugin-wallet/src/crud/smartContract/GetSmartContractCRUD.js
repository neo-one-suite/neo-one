/* @flow */
import { type GetCLIResourceOptions, GetCRUD } from '@neo-one/server-plugin';

import type SmartContractResourceType, {
  SmartContract,
  SmartContractResourceOptions,
} from '../../SmartContractResourceType';

import common from './common';

export default class GetSmartContractCRUD extends GetCRUD<
  SmartContract,
  SmartContractResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: SmartContractResourceType |}) {
    super({
      resourceType,
      options: common.options,
    });
  }

  getCLIResourceOptions(
    options: GetCLIResourceOptions,
  ): Promise<SmartContractResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
