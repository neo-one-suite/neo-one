import {
  ExecCLIOptions,
  GetCLIAutocompleteOptions,
  GetCLINameOptions,
  GetCLIResourceOptions,
  StartCRUD,
} from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants } from '../../constants';
import { Wallet, WalletResourceOptions, WalletResourceType } from '../../WalletResourceType';
import { common } from './common';

export class StartWalletCRUD extends StartCRUD<Wallet, WalletResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: WalletResourceType }) {
    super({
      name: 'open',
      resourceType,
      options: common.options.concat([
        {
          option: '-p, --password <password>',
          description:
            'Password to decrypt the private key. Only applicable to ' +
            'MainNet wallets. If not provided, a prompt for the password ' +
            'will appear.',
        },
      ]),
    });
  }

  public async getCLIName(options: GetCLINameOptions<WalletResourceOptions>): Promise<string> {
    return common.getCLIName(options);
  }

  public async getCLIAutocompleteResourceOptions({ cli }: GetCLIAutocompleteOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  public async getCLIResourceOptions(optionsIn: GetCLIResourceOptions): Promise<WalletResourceOptions> {
    const { cli, options } = optionsIn;
    const { network } = await common.getCLIResourceOptions(optionsIn);
    let { password } = options;
    if (network === networkConstants.NETWORK_NAME.MAIN && password == undefined) {
      password = await common.promptPassword({
        cli,
        prompt: 'Enter password',
      });
    }

    return { network, password };
  }

  public async postExecCLI({ name, cli }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    const { name: originalName, network } = constants.extractWallet(name);
    await cli.exec(`activate wallet ${originalName} --network ${network}`);
  }
}
