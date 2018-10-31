import { ABI, SmartContractNetworksDefinition } from '@neo-one/client-common';
import { genFiles } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import * as path from 'path';
import { RawSourceMap } from 'source-map';
import { ProjectConfig } from '../types';
import { getCommonPaths, getContractPaths, getTSPath } from '../utils';
import { writeFile } from './writeFile';

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
  if (project.codegen.javascript) {
    await Promise.all([writeFile(abiPath, abi.js), writeFile(createContractPath, contract.js)]);
  } else {
    await Promise.all([
      writeFile(getTSPath(abiPath), abi.ts),
      writeFile(getTSPath(createContractPath), contract.ts),
      writeFile(getTSPath(typesPath), types.ts),
    ]);
  }
};
