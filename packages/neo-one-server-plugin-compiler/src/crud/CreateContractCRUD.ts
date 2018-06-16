import { CreateCRUD, GetCLIResourceOptions } from '@neo-one/server-plugin';
import fs from 'fs-extra';
import path from 'path';
import { Contract, ContractResourceOptions, ContractResourceType } from '../ContractResourceType';
import { ABIRequiredError } from '../errors';

export class CreateContractCRUD extends CreateCRUD<Contract, ContractResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: ContractResourceType }) {
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

        {
          option: '--payable',
          description: 'Is the Smart Contract payable?',
        },
      ],
    });
  }

  public async getCLIResourceOptions({ args, options }: GetCLIResourceOptions): Promise<ContractResourceOptions> {
    const { smartContractPath } = args;
    const { abi: abiPath } = options;

    let abi;
    const ext = path.extname(smartContractPath);
    if (ext === '.py' || ext === '.dll') {
      if (abiPath == undefined) {
        throw new ABIRequiredError();
      }

      abi = await fs.readJSON(abiPath);
    }

    return {
      scPath: smartContractPath,
      abi,
      hasStorage: !!options.storage,
      hasDynamicInvoke: !!options['dynamic-invoke'],
      payable: !!options.payable,
    };
  }
}
