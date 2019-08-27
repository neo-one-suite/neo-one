import { Configuration } from '@neo-one/cli-common';
import { SmartContractNetworksDefinition } from '@neo-one/client-common';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as nodePath from 'path';
import stringify from 'safe-stable-stringify';

export interface Deployed {
  readonly [name: string]: SmartContractNetworksDefinition;
}

const getDeployedFile = (config: Configuration) => nodePath.resolve(config.artifacts.path, 'deployed.json');
export const loadDeployed = async (config: Configuration): Promise<Deployed> => {
  try {
    const contents = await fs.readFile(getDeployedFile(config), 'utf8');

    return JSON.parse(contents);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }

    throw err;
  }
};

export const saveDeployed = async (config: Configuration, deployed: Deployed) => {
  const existing = await loadDeployed(config);

  const final = _.merge({}, existing, deployed);
  const file = getDeployedFile(config);
  await fs.ensureDir(nodePath.dirname(file));
  await fs.writeFile(file, stringify(final, undefined, 2));
};
