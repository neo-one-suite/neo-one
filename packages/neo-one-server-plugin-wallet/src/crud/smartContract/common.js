/* @flow */
import {
  type GetCLINameOptions,
  type GetCLIResourceOptions,
} from '@neo-one/server-plugin';

import { constants as networkConstants } from '@neo-one/server-plugin-network';

import { NetworkRequiredError } from '../../errors';
import type { SmartContractResourceOptions } from '../../SmartContractResourceType';

import constants from '../../constants';

const getCLIName = ({
  baseName,
  options: { network },
}: GetCLINameOptions<SmartContractResourceOptions>): Promise<string> => {
  if (network == null) {
    throw new NetworkRequiredError();
  }

  return Promise.resolve(constants.makeWallet({ name: baseName, network }));
};

const getNetworkName = async ({ cli, options }: GetCLIResourceOptions) => {
  const { network: networkName } = options;
  if (networkName != null && typeof networkName === 'string') {
    return networkName;
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != null && typeof network === 'string') {
    return network;
  }

  throw new Error(
    'Smart contracts are deployed to a network. Activate a network by ' +
      'running `activate network <name>` or specify the network via ' +
      '`--network <name>`',
  );
};

const getWalletName = async ({ cli, options }: GetCLIResourceOptions) => {
  const { wallet: walletName } = options;
  if (walletName != null && typeof walletName === 'string') {
    return walletName;
  }

  const { wallet } = await cli.getSession(constants.PLUGIN);
  if (wallet != null && typeof wallet === 'string') {
    return wallet;
  }

  throw new Error(
    'Smart contracts are deployed using a wallet. Activate a wallet by ' +
      'running `activate wallet <name>` or specify the wallet via ' +
      '`--wallet <name>`',
  );
};

const getCLIResourceOptions = async (
  options: GetCLIResourceOptions,
): Promise<SmartContractResourceOptions> => {
  const [network, wallet] = await Promise.all([
    getNetworkName(options),
    getWalletName(options),
  ]);

  return { network, wallet };
};

const options = [
  {
    option: '-n, --network <name>',
    description: 'Network the smart contract is deployed to.',
  },
];

export default {
  getCLIName,
  getCLIResourceOptions,
  options,
};
