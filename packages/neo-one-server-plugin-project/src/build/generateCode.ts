import { ABI, SmartContractNetworksDefinition } from '@neo-one/client';
import { genFiles } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import * as path from 'path';
import { RawSourceMap } from 'source-map';
import { ProjectConfig } from '../types';

export const generateCode = async (
  project: ProjectConfig,
  contractResult: {
    readonly filePath: string;
    readonly name: string;
    readonly abi: ABI;
    readonly sourceMap: RawSourceMap;
  },
  networksDefinition: SmartContractNetworksDefinition,
) => {
  const base = path.resolve(project.paths.generated, contractResult.name);
  const sourceMapsPath = path.resolve(project.paths.generated, 'sourceMaps.ts');
  const typesPath = path.resolve(base, 'types.ts');
  const abiPath = path.resolve(base, 'abi.ts');
  const createContractPath = path.resolve(base, 'contract.ts');
  const { abi, contract, types } = genFiles({
    name: contractResult.name,
    networksDefinition,
    contractPath: contractResult.filePath,
    typesPath,
    abiPath,
    createContractPath,
    abi: contractResult.abi,
    sourceMapsPath,
  });

  await fs.ensureDir(base);
  await Promise.all([
    fs.writeFile(abiPath, abi),
    fs.writeFile(createContractPath, contract),
    fs.writeFile(typesPath, types),
  ]);
};
