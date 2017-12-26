/* @flow */
import {
  type ExecCLIOptions,
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  DeleteCRUD,
} from '@neo-one/server-plugin';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../../WalletResourceType';

import common from './common';

export default class DeleteWalletCRUD extends DeleteCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      resourceType,
      help:
        'Deletes the wallet called <name>. This permanently deletes ' +
        'the wallet from NEO•ONE, there is no way to recover it.',
      options: common.options,
    });
  }

  getCLIName(
    options: GetCLINameOptions<WalletResourceOptions>,
  ): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIResourceOptions(
    options: GetCLIResourceOptions,
  ): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }

  async postExecCLI({
    cli,
  }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    await cli.exec(`deactivate wallet`);
  }
}
