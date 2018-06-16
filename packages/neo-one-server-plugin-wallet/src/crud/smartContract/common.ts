import { GetCLINameOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants } from '../../constants';
import { NetworkRequiredError } from '../../errors';
import { SmartContractResourceOptions } from '../../SmartContractResourceType';

const getCLIName = async ({
  baseName,
  options: { network },
}: GetCLINameOptions<SmartContractResourceOptions>): Promise<string> => {
  if (network === undefined) {
    throw new NetworkRequiredError();
  }

  return Promise.resolve(constants.makeWallet({ name: baseName, network }));
};

const getNetworkName = async ({ cli, options }: GetCLIResourceOptions) => {
  const { network: networkName } = options;
  if (networkName != undefined && typeof networkName === 'string') {
    return networkName;
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != undefined && typeof network === 'string') {
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
  if (walletName != undefined && typeof walletName === 'string') {
    return walletName;
  }

  const { wallet } = await cli.getSession(constants.PLUGIN);
  if (wallet != undefined && typeof wallet === 'string') {
    return wallet;
  }

  throw new Error(
    'Smart contracts are deployed using a wallet. Activate a wallet by ' +
      'running `activate wallet <name>` or specify the wallet via ' +
      '`--wallet <name>`',
  );
};

const getCLIResourceOptions = async (options: GetCLIResourceOptions): Promise<SmartContractResourceOptions> => {
  const [network, wallet] = await Promise.all([getNetworkName(options), getWalletName(options)]);

  return { network, wallet };
};

const smartContractOptions: ReadonlyArray<{ readonly option: string; readonly description: string }> = [
  {
    option: '-n, --network <name>',
    description: 'Network the smart contract is deployed to.',
  },
];

export const common = {
  getCLIName,
  getCLIResourceOptions,
  options: smartContractOptions,
};
