/* @flow */
import {
  type ExecCLIOptions,
  type GetCLIAutocompleteOptions,
  CreateCRUD,
} from '@neo-one/server';
import { type InteractiveCLI, compoundName } from '@neo-one/server-common';

import client from '@neo-one/client';
import { constants as networkConstants } from '@neo-one/server-plugin-network';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../WalletResourceType';

import common from './common';

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
    let password;
    let { privateKey } = options;
    if (privateKey == null && network === networkConstants.NETWORK_NAME.MAIN) {
      password = await common.promptPassword({
        cli,
        prompt: ENCRYPT_MESSAGE,
      });
    } else if (privateKey != null) {
      let valid = false;
      try {
        client.wifToPrivateKey(privateKey);
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
      } else if (client.isNEP2(privateKey)) {
        password = await common.promptPassword({
          cli,
          prompt: 'Enter password: ',
        });
        privateKey = await client.decryptNEP2({
          encryptedKey: privateKey,
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
    const { name: originalName } = compoundName.extract(name);
    let command = `open wallet ${originalName} --network ${options.network}`;
    if (options.password != null) {
      command += ` --password ${options.password}`;
    }
    await cli.exec(command);
  }
}
