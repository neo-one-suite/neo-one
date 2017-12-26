/* @flow */
import { type GetCLIResourceOptions, CreateCRUD } from '@neo-one/server-plugin';

import fs from 'fs-extra';
import path from 'path';

import { ABIRequiredError } from '../errors';
import type ContractResourceType, {
  Contract,
  ContractResourceOptions,
} from '../ContractResourceType';

export default class CreateContractCRUD extends CreateCRUD<
  Contract,
  ContractResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: ContractResourceType |}) {
    super({
      name: 'compile',
      resourceType,
      extraArgs: ['<smartContractPath>'],
      options: [
        {
          option: '--abi <path>',
          description: 'Path to JSON file containing ABI. ',
        },
        {
          option: '--storage',
          description: 'Does the Smart Contract use storage?',
        },
        {
          option: '--dynamic-invoke',
          description: 'Does the Smart Contract use dynamic invocations?',
        },
      ],
    });
  }

  async getCLIResourceOptions({
    args,
    options,
  }: GetCLIResourceOptions): Promise<ContractResourceOptions> {
    const { smartContractPath } = args;
    const { abi: abiPath } = options;

    let abi;
    const ext = path.extname(smartContractPath);
    if (ext === '.py' || ext === '.dll') {
      if (abiPath == null) {
        throw new ABIRequiredError();
      }

      abi = await fs.readJSON(abiPath);
    }

    return {
      scPath: smartContractPath,
      abi,
      hasStorage: !!options.storage,
      hasDynamicInvoke: !!options['dynamic-invoke'],
    };
  }
}
