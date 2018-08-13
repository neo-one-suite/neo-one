import { SmartContractNetworksDefinition } from '@neo-one/client';
import { genFiles } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import * as path from 'path';
import { ProjectConfig } from '../types';
import { ContractResult } from './compileContract';

export const generateCode = async (
  project: ProjectConfig,
  contractResult: ContractResult,
  networksDefinition: SmartContractNetworksDefinition,
) => {
  const base = path.resolve(project.paths.generated, contractResult.contractName);
  const typesPath = path.resolve(base, 'types.ts');
  const abiPath = path.resolve(base, 'abi.ts');
  const createContractPath = path.resolve(base, 'contract.ts');
  const testPath = path.resolve(base, 'test.ts');
  const { abi, contract, types, test } = genFiles({
    name: contractResult.contractName,
    networksDefinition,
    contractPath: contractResult.filePath,
    typesPath,
    abiPath,
    createContractPath,
    testPath,
    abi: contractResult.abi,
    sourceMap: contractResult.sourceMap,
  });

  await fs.ensureDir(base);
  await Promise.all([
    fs.writeFile(abiPath, abi),
    fs.writeFile(createContractPath, contract),
    fs.writeFile(typesPath, types),
    fs.writeFile(testPath, test),
  ]);
};
