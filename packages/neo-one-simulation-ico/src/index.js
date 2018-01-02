/* @flow */
import path from 'path';

import abi from './abi';

const preCompile = path.resolve(__dirname, 'bin', 'pre-compile');
const postCreate = path.resolve(__dirname, 'bin', 'post-create');

export default {
  contract: {
    targetDir: 'contracts',
    defaultLanguage: 'python',
    languages: {
      python: {
        rootDir: path.resolve(__dirname, '..', 'contracts', 'python'),
        contracts: [
          {
            file: 'ico.py',
            resourceName: 'ico',
            target: 'deploy',
            name: 'NEO-ONE Sale',
            codeVersion: '1.0.0',
            properties: {
              storage: true,
            },
            abi,
          },
        ],
      },
    },
  },
  wallets: {
    owner: { wif: 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g' },
    kyc0: { neo: 100 },
    kyc1: { neo: 1000 },
    kyc2: { neo: 50 },
    noKYC0: { neo: 500 },
  },
  hooks: {
    preCompile,
    postCreate,
  },
  configPath: path.join('src', 'neo-one.json'),
  templateDir: path.resolve(__dirname, '..', 'template'),
};
