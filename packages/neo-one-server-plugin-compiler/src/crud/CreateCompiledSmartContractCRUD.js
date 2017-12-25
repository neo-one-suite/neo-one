/* @flow */
import { type GetCLIResourceOptions, CreateCRUD } from '@neo-one/server-plugin';

import fs from 'fs-extra';
import path from 'path';

import { ABIRequiredError } from '../errors';
import type CompiledSmartContractResourceType, {
  CompiledSmartContract,
  CompiledSmartContractResourceOptions,
} from '../CompiledSmartContractResourceType';

export default class CreateCompiledSmartContractCRUD extends CreateCRUD<
  CompiledSmartContract,
  CompiledSmartContractResourceOptions,
> {
  constructor({
    resourceType,
  }: {|
    resourceType: CompiledSmartContractResourceType,
  |}) {
    super({
      resourceType,
      extraArgs: ['<smartContractPath>'],
      options: [
        {
          option: '--abi <path>',
          description: 'Path to JSON file containing ABI. ',
        },
      ],
    });
  }

  async getCLIResourceOptions({
    args,
    options,
  }: GetCLIResourceOptions): Promise<CompiledSmartContractResourceOptions> {
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

    return { scPath: smartContractPath, abi };
  }
}
