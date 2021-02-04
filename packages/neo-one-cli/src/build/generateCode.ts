import { Configuration } from '@neo-one/cli-common';
import { ContractManifestClient, SmartContractNetworksDefinition } from '@neo-one/client-common';
import { genFiles } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import * as nodePath from 'path';
import { getCommonPaths, getContractPaths, getTSPath } from '../common';
import { writeFile } from '../utils';

export const generateCode = async (
  config: Configuration,
  filePath: string,
  name: string,
  manifest: ContractManifestClient,
  networksDefinition: SmartContractNetworksDefinition,
) => {
  const base = nodePath.resolve(config.codegen.path, name);
  const { sourceMapsPath } = getCommonPaths(config);
  const { typesPath, manifestPath, createContractPath } = getContractPaths(config, name);
  const { manifest: manifestFile, contract, types } = genFiles({
    name,
    networksDefinition,
    contractPath: filePath,
    typesPath,
    manifestPath,
    createContractPath,
    manifest,
    sourceMapsPath,
    browserify: config.codegen.browserify,
  });

  if (config.codegen.codesandbox) {
    await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
  }
  await fs.ensureDir(base);
  if (config.codegen.language === 'typescript') {
    await Promise.all([
      writeFile(getTSPath(manifestPath), manifestFile.ts),
      writeFile(getTSPath(createContractPath), contract.ts),
      writeFile(getTSPath(typesPath), types.ts),
    ]);
  } else {
    await Promise.all([writeFile(manifestPath, manifestFile.js), writeFile(createContractPath, contract.js)]);
  }
};
