/* @flow */
import {
  type ExecCLIOptions,
  type GetCLIAutocompleteOptions,
  StartCRUD,
} from '@neo-one/server';
import { type InteractiveCLI, compoundName } from '@neo-one/server-common';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../WalletResourceType';

import common from './common';
import constants from '../constants';

export default class StartWalletCRUD extends StartCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
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

  getCLIName(options: {|
    baseName: string,
    cli: InteractiveCLI,
    options: WalletResourceOptions,
  |}): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIAutocompleteResourceOptions({
    cli,
  }: GetCLIAutocompleteOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions({ cli, options: {} });
  }

  async getCLIResourceOptions({
    cli,
    options,
  }: {|
    cli: InteractiveCLI,
    // flowlint-next-line unclear-type:off
    options: Object,
  |}): Promise<WalletResourceOptions> {
    const { network } = await common.getCLIResourceOptions({ cli, options });
    let { password } = options;
    if (network === constants.MAIN_NETWORK && password == null) {
      password = await common.promptPassword({
        cli,
        prompt: 'Enter password',
      });
    }

    return { network, password };
  }

  async postExecCLI({
    name,
    cli,
    options,
  }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    const { name: originalName } = compoundName.extract(name);
    await cli.exec(
      `activate wallet ${originalName} --network ${options.network}`,
    );
  }
}
