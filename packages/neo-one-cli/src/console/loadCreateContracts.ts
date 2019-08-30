// tslint:disable no-var-before-return
import { Configuration } from '@neo-one/cli-common';
import * as nodePath from 'path';
import { loadJS } from '../common';

export const loadCreateContracts = async (config: Configuration) => {
  const contractsPath = nodePath.resolve(config.codegen.path, 'contracts');
  const { createContracts } = await loadJS(contractsPath);

  return createContracts;
};
