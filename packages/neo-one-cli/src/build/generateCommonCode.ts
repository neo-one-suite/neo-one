import { Configuration } from '@neo-one/cli-common';
import { common, privateKeyToWIF, SourceMaps } from '@neo-one/client-common';
import { genCommonFiles, NetworkDefinition } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import { RawSourceMap } from 'source-map';
import { getCommonPaths, getContractPaths, getPrimaryKeys, getTSPath } from '../common';
import { writeFile } from '../utils';
import { WALLETS } from './setupWallets';

export interface Contract {
  readonly name: string;
  readonly filePath: string;
  readonly sourceMap: RawSourceMap;
}

export const generateCommonCode = async (
  config: Configuration,
  contracts: readonly Contract[],
  networks: readonly NetworkDefinition[],
  sourceMapsIn: SourceMaps,
) => {
  const contractsPaths = contracts.map(({ name, filePath, sourceMap }) => ({
    ...getContractPaths(config, name),
    sourceMap,
    name,
    contractPath: filePath,
  }));
  const {
    sourceMapsPath,
    testPath,
    contractsPath,
    reactPath,
    angularPath,
    vuePath,
    clientPath,
    generatedPath,
  } = getCommonPaths(config);
  const { sourceMaps, test, contracts: contractsContent, react, angular, vue, client, generated } = genCommonFiles({
    contractsPaths,
    testPath,
    contractsPath,
    reactPath,
    angularPath,
    vuePath,
    clientPath,
    generatedPath,
    localDevNetworkName: 'local',
    localDevNetworkPort: config.network.port,
    wallets: [
      {
        name: 'master',
        wif: privateKeyToWIF(common.privateKeyToString(getPrimaryKeys().privateKey)),
      },
    ].concat(WALLETS),
    networks,
    sourceMapsPath,
    sourceMaps: sourceMapsIn,
    framework: config.codegen.framework,
    browserify: config.codegen.browserify,
  });

  if (config.codegen.codesandbox) {
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
  }
  await fs.ensureDir(config.codegen.path);
  await Promise.all(
    [
      {
        path: sourceMapsPath,
        data: sourceMaps,
      },
      {
        path: testPath,
        data: test,
      },
      {
        path: reactPath,
        data: config.codegen.framework === 'react' ? react : undefined,
      },
      {
        path: angularPath,
        data: config.codegen.framework === 'angular' ? angular : undefined,
      },
      {
        path: vuePath,
        data: config.codegen.framework === 'vue' ? vue : undefined,
      },
      {
        path: clientPath,
        data: client,
      },
      {
        path: generatedPath,
        data: generated,
      },
      {
        path: contractsPath,
        data: contractsContent,
      },
    ].map(async ({ path, data }) => {
      if (data !== undefined) {
        if (config.codegen.language === 'typescript') {
          await writeFile(getTSPath(path), data.ts);
        } else {
          await writeFile(path, data.js);
        }
      }
    }),
  );
};
