/* @flow */
import { type ExecCLIOptions, StopCRUD } from '@neo-one/server';
import { type InteractiveCLI } from '@neo-one/server-common';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../WalletResourceType';

import common from './common';

export default class StopWalletCRUD extends StopCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      name: 'close',
      resourceType,
      help:
        'Closes the wallet called <name>. Only applies to MainNet ' +
        'wallets. Closing the wallet locks it and removes unencrypted ' +
        'private key.',
      options: common.options,
    });
  }

  getCLIName(options: {|
    baseName: string,
    cli: InteractiveCLI,
    options: WalletResourceOptions,
  |}): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIResourceOptions(options: {|
    cli: InteractiveCLI,
    // flowlint-next-line unclear-type:off
    options: Object,
  |}): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }

  async postExecCLI({
    cli,
  }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    await cli.exec(`deactivate wallet`);
  }
}
