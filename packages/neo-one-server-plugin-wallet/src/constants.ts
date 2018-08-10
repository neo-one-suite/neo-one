import { compoundName } from '@neo-one/server-plugin';

const MASTER_WALLET = 'master';

export const constants = {
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
  makeWallet: ({ network, name }: { readonly network: string; readonly name: string }) =>
    compoundName.make({ name, names: [network] }),
  extractWallet: (name: string): { readonly network: string; readonly name: string } => {
    const {
      names: [network],
      name: baseName,
    } = compoundName.extract(name);

    return { network, name: baseName };
  },
  makeContract: ({ network, name }: { readonly network: string; readonly name: string }) =>
    compoundName.make({ name, names: [network] }),
  extractContract: (name: string): { readonly network: string; readonly name: string } => {
    const {
      names: [network],
      name: baseName,
    } = compoundName.extract(name);

    return { network, name: baseName };
  },
  MAIN_URL: 'https://neotracker.io/rpc',
};
