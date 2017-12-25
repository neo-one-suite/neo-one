/* @flow */
import { type InteractiveCLIArgs, compoundName } from '@neo-one/server-plugin';

import { take } from 'rxjs/operators';

import type WalletPlugin from './WalletPlugin';

import constants from './constants';

export default (plugin: WalletPlugin) => ({ cli }: InteractiveCLIArgs) => {
  const { describe } = plugin.walletResourceType.getCRUD();
  const command = cli.vorpal
    .command(
      'activate wallet <name>',
      'Activates Wallet <name>, setting it as the default wallet for ' +
        'other commands.',
    )
    .autocomplete({
      data: async () => describe.getCLIAutocomplete({ cli }),
    })
    .action(async args => {
      const options = await describe.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });
      const name = await describe.getCLIName({
        baseName: args.name,
        cli,
        options,
      });
      const { names: [network] } = compoundName.extract(name);
      const resource = await plugin.walletResourceType
        .getResource$({
          name,
          client: cli.client,
          options: { network },
        })
        .pipe(take(1))
        .toPromise();
      if (resource == null) {
        throw new Error(`Wallet ${args.name} does not exist.`);
      }

      cli.mergeSession(plugin.name, { wallet: name });
      cli.addDelimiter(constants.DELIMITER_KEY, args.name);
    });

  describe.options.forEach(({ option, description }) => {
    command.option(option, description);
  });

  return command;
};
