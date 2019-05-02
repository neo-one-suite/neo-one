import { GetCLIResourceOptions } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { NEOTrackerResourceOptions } from '../NEOTrackerResourceType';

const getCLIResourceOptions = async ({ cli, options }: GetCLIResourceOptions): Promise<NEOTrackerResourceOptions> => {
  const { network: networkName } = options;
  if (networkName != undefined && typeof networkName === 'string') {
    return { network: networkName };
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != undefined && typeof network === 'string') {
    return { network };
  }

  throw new Error(
    'NEO Tracker must be associated with a network. Activate a network by ' +
      'running `activate network <name>` or specify the network via ' +
      '`--network <name>`',
  );
};

const neotrackerOptions: readonly { readonly option: string; readonly description: string }[] = [
  {
    option: '-n, --network <name>',
    description: 'Network the NEO Tracker instance is associated with.',
  },
];

export const common = {
  getCLIResourceOptions,
  options: neotrackerOptions,
};
