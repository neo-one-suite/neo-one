import {
  CreateCRUD,
  GetCLIAutocompleteOptions,
  GetCLINameOptions,
  GetCLIResourceOptions,
  InteractiveCLI,
  name,
} from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import { ABIRequiredError, ContractOrHashRequiredError } from '../../errors';
import {
  SmartContract,
  SmartContractRegister,
  SmartContractResourceOptions,
  SmartContractResourceType,
} from '../../SmartContractResourceType';
import { common } from './common';

const CONTRACT_OR_HASH_MESSAGE = 'Specify a compiled contract with --contract or an existing script hash with --hash.';

export class CreateSmartContractCRUD extends CreateCRUD<SmartContract, SmartContractResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: SmartContractResourceType }) {
    super({
      name: 'deploy',
      resourceType,
      options: common.options.concat([
        {
          option: '-w, --wallet <name>',
          description: 'Wallet to deploy the smart contract with.',
        },

        {
          option: '-h, --hash <scriptHash>',
          description: `Script hash of an existing contract to register with ${name.title}`,
        },

        {
          option: '-c, --contract <compiledContract>',
          description: `Name of the compiled contract to deploy.`,
        },

        {
          option: '--abi <abiPath>',
          description: `Path to a JSON file containing the ABI. Only required when --hash is specified.`,
        },
      ]),
    });
  }

  public async getCLIName(options: GetCLINameOptions<SmartContractResourceOptions>): Promise<string> {
    return common.getCLIName(options);
  }

  public async getCLIAutocompleteResourceOptions({
    cli,
  }: GetCLIAutocompleteOptions): Promise<SmartContractResourceOptions> {
    return common.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  public async getCLIResourceOptions(optionsIn: GetCLIResourceOptions): Promise<SmartContractResourceOptions> {
    const { cli, options } = optionsIn;
    const { network, wallet } = await common.getCLIResourceOptions(optionsIn);
    let hash;
    let abi;
    let contract;
    if (options.hash == undefined) {
      if (options.contract == undefined) {
        throw new ContractOrHashRequiredError(CONTRACT_OR_HASH_MESSAGE);
      }

      const register = await this.promptRegister({
        cli,
        name: options.contract,
      });

      contract = {
        name: options.contract,
        register,
      };
    } else {
      if (options.abi == undefined) {
        throw new ABIRequiredError('Specify a path to a json file containing the ABI with --abi.');
      }

      hash = options.hash;
      abi = await fs.readJSON(options.abi);
    }

    return { network, wallet, abi, contract, hash };
  }

  private async promptRegister({
    cli,
    name: nameIn,
  }: {
    readonly cli: InteractiveCLI;
    readonly name: string;
  }): Promise<SmartContractRegister> {
    const { contractName, codeVersion, author, email, description } = await cli.prompt([
      {
        type: 'input',
        name: 'contractName',
        message: 'Name: ',
        default: nameIn,
      },

      {
        type: 'input',
        name: 'codeVersion',
        message: 'Version: ',
        default: '1.0.0',
      },

      {
        type: 'input',
        name: 'author',
        message: 'Author: ',
        default: '',
      },

      {
        type: 'input',
        name: 'email',
        message: 'Email: ',
        default: '',
      },

      {
        type: 'input',
        name: 'description',
        message: 'Description: ',
        default: '',
      },
    ]);

    return {
      name: contractName,
      codeVersion,
      author,
      email,
      description,
    };
  }
}
