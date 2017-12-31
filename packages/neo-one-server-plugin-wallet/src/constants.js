/* @flow */
import { compoundName } from '@neo-one/server-plugin';

const MASTER_WALLET = 'master';

export default {
  PLUGIN: '@neo-one/server-plugin-wallet',
  WALLET_RESOURCE_TYPE: 'wallet',
  DELIMITER_KEY: 'wallet',
  SMART_CONTRACT_RESOURCE_TYPE: 'smartcontract',
  MASTER_WALLET,
  makeMasterWallet: (network: string) =>
    compoundName.make({
      name: MASTER_WALLET,
      names: [network],
    }),
  makeWallet: ({ network, name }: {| network: string, name: string |}) =>
    compoundName.make({ name, names: [network] }),
  extractWallet: (name: string): {| network: string, name: string |} => {
    const { names: [network], name: baseName } = compoundName.extract(name);
    return { network, name: baseName };
  },
  makeContract: ({ network, name }: {| network: string, name: string |}) =>
    compoundName.make({ name, names: [network] }),
  extractContract: (name: string): {| network: string, name: string |} => {
    const { names: [network], name: baseName } = compoundName.extract(name);
    return { network, name: baseName };
  },
};
