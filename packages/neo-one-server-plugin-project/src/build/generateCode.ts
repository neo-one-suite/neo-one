import { ABI, SmartContractNetworksDefinition } from '@neo-one/client';
import { genFiles } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import * as path from 'path';
import { RawSourceMap } from 'source-map';
import { ProjectConfig } from '../types';
import { getCommonPaths, getContractPaths } from './paths';

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
  const sourceMapsPath = getCommonPaths(project).sourceMapsPath;
  const { typesPath, abiPath, createContractPath } = getContractPaths(project, contractResult);
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
