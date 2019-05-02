import { GetCLINameOptions, GetCLIResourceOptions, InteractiveCLI } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants } from '../../constants';
import { NetworkRequiredError } from '../../errors';
import { WalletResourceOptions } from '../../WalletResourceType';

const getCLIName = async ({
  baseName,
  options: { network },
}: GetCLINameOptions<WalletResourceOptions>): Promise<string> => {
  if (network === undefined) {
    throw new NetworkRequiredError();
  }

  return Promise.resolve(constants.makeWallet({ name: baseName, network }));
};

const getCLIResourceOptions = async ({ cli, options }: GetCLIResourceOptions): Promise<WalletResourceOptions> => {
  const { network: networkName } = options;
  if (networkName != undefined && typeof networkName === 'string') {
    return { network: networkName };
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != undefined && typeof network === 'string') {
    return { network };
  }

  throw new Error(
    'Wallets are associated with a network. Activate a network by ' +
      'running `activate network <name>` or specify the network via ' +
      '`--network <name>`',
  );
};

const promptPassword = async ({ cli, prompt }: { readonly cli: InteractiveCLI; readonly prompt: string }) =>
  cli.prompt([
    {
      type: 'password',
      name: 'password',
      message: prompt,
      // tslint:disable-next-line no-any
      validate: (input: any) => {
        if (typeof input !== 'string' || input.length < 8) {
          return 'Password must be at least 8 characters';
        }

        return true;
      },
    },
  ]);

const walletOptions: readonly { readonly option: string; readonly description: string }[] = [
  {
    option: '-n, --network <name>',
    description: 'Network the wallet is associated with.',
  },
];

export const common = {
  getCLIName,
  getCLIResourceOptions,
  promptPassword,
  options: walletOptions,
};
