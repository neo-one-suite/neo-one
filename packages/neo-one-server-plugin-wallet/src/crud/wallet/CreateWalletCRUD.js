/* @flow */
import {
  type ExecCLIOptions,
  type GetCLIAutocompleteOptions,
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  CreateCRUD,
} from '@neo-one/server-plugin';

import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { decryptNEP2, isNEP2, wifToPrivateKey } from '@neo-one/client';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../../WalletResourceType';

import common from './common';
import constants from '../../constants';

const ENCRYPT_MESSAGE = 'Enter a password to encrypt your private key: ';

export default class CreateWalletCRUD extends CreateCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      resourceType,
      options: common.options.concat([
        {
          option: '-p, --private-key <WIF>',
          description:
            'Private Key to create the wallet with. If a private key is not ' +
            'provided, one will be generated automatically',
        },
      ]),
    });
  }

  getCLIName(
    options: GetCLINameOptions<WalletResourceOptions>,
  ): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIAutocompleteResourceOptions({
    cli,
  }: GetCLIAutocompleteOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  async getCLIResourceOptions(
    optionsIn: GetCLIResourceOptions,
  ): Promise<WalletResourceOptions> {
    const { cli, options } = optionsIn;
    const { network } = await common.getCLIResourceOptions(optionsIn);
    let password;
    const wif = options['private-key'];
    let privateKey;
    if (wif == null && network === networkConstants.NETWORK_NAME.MAIN) {
      password = await common.promptPassword({
        cli,
        prompt: ENCRYPT_MESSAGE,
      });
    } else if (wif != null) {
      let valid = false;
      try {
        privateKey = wifToPrivateKey(wif);
        valid = true;
      } catch (error) {
        valid = false;
      }

      if (valid) {
        if (network === networkConstants.NETWORK_NAME.MAIN) {
          password = await common.promptPassword({
            cli,
            prompt: ENCRYPT_MESSAGE,
          });
        }
      } else if (isNEP2(wif)) {
        password = await common.promptPassword({
          cli,
          prompt: 'Enter password: ',
        });
        privateKey = await decryptNEP2({
          encryptedKey: wif,
          password,
        });
      } else if (network === networkConstants.NETWORK_NAME.MAIN) {
        throw new Error(
          'Invalid private key. Please provide a private key or ' +
            'NEP2 encrypted key.',
        );
      } else {
        throw new Error(
          'Invalid private key. Please provide a valid private key or ' +
            'NEP2 encrypted key, or do not provide one at all and one will ' +
            'be generated automatically (recommended).',
        );
      }
    }

    return { network, password, privateKey };
  }

  async postExecCLI({
    name,
    cli,
    options,
  }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    const { name: originalName, network } = constants.extractWallet(name);
    let command = `open wallet ${originalName} --network ${network}`;
    if (options.password != null) {
      command += ` --password ${options.password}`;
    }
    await cli.exec(command);
  }
}
