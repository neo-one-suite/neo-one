/* @flow */
import {
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  DeleteCRUD,
} from '@neo-one/server-plugin';

import type SmartContractResourceType, {
  SmartContract,
  SmartContractResourceOptions,
} from '../../SmartContractResourceType';

import common from './common';

export default class DeleteSmartContractCRUD extends DeleteCRUD<
  SmartContract,
  SmartContractResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: SmartContractResourceType |}) {
    super({
      resourceType,
      help:
        'Deletes the smart contract called <name>. This only removes ' +
        'the smart contract from NEO•ONE, it will still exist on the blockchain.',
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
