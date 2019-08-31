import { Configuration } from '@neo-one/cli-common';
import { ABI, SmartContractNetworksDefinition } from '@neo-one/client-common';
import { genFiles } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import * as nodePath from 'path';
import { getCommonPaths, getContractPaths, getTSPath } from '../common';
import { writeFile } from '../utils';

export const generateCode = async (
  config: Configuration,
  filePath: string,
  name: string,
  abi: ABI,
  networksDefinition: SmartContractNetworksDefinition,
) => {
  const base = nodePath.resolve(config.codegen.path, name);
  const { sourceMapsPath } = getCommonPaths(config);
  const { typesPath, abiPath, createContractPath } = getContractPaths(config, name);
  const { abi: abiFile, contract, types } = genFiles({
    name,
    networksDefinition,
    contractPath: filePath,
    typesPath,
    abiPath,
    createContractPath,
    abi,
    sourceMapsPath,
    browserify: config.codegen.browserify,
  });

  await fs.ensureDir(base);
  if (config.codegen.language === 'typescript') {
    await Promise.all([
      writeFile(getTSPath(abiPath), abiFile.ts),
      writeFile(getTSPath(createContractPath), contract.ts),
      writeFile(getTSPath(typesPath), types.ts),
    ]);
  } else {
    await Promise.all([writeFile(abiPath, abiFile.js), writeFile(createContractPath, contract.js)]);
  }
};
