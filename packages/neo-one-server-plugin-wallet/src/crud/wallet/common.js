/* @flow */
import {
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  type InteractiveCLI,
} from '@neo-one/server-plugin';

import { constants as networkConstants } from '@neo-one/server-plugin-network';

import { NetworkRequiredError } from '../../errors';
import type { WalletResourceOptions } from '../../WalletResourceType';

import constants from '../../constants';

const getCLIName = ({
  baseName,
  options: { network },
}: GetCLINameOptions<WalletResourceOptions>): Promise<string> => {
  if (network == null) {
    throw new NetworkRequiredError();
  }

  return Promise.resolve(constants.makeWallet({ name: baseName, network }));
};

const getCLIResourceOptions = async ({
  cli,
  options,
}: GetCLIResourceOptions): Promise<WalletResourceOptions> => {
  const { network: networkName } = options;
  if (networkName != null && typeof networkName === 'string') {
    return { network: networkName };
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != null && typeof network === 'string') {
    return { network };
  }

  throw new Error(
    'Wallets are associated with a network. Activate a network by ' +
      'running `activate network <name>` or specify the network via ' +
      '`--network <name>`',
  );
};

const promptPassword = async ({
  cli,
  prompt,
}: {|
  cli: InteractiveCLI,
  prompt: string,
|}) => {
  const { password } = await cli.prompt([
    {
      type: 'password',
      name: 'password',
      message: prompt,
      validate: input => {
        if (typeof input !== 'string' || input.length < 8) {
          return 'Password must be at least 8 characters';
        }

        return true;
      },
    },
  ]);
  return password;
};

const options = [
  {
    option: '-n, --network <name>',
    description: 'Network the wallet is associated with.',
  },
];

export default {
  getCLIName,
  getCLIResourceOptions,
  promptPassword,
  options,
};
