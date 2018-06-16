import { CLIArgs, name } from '@neo-one/server-plugin';
import pkg from '../../package.json';

export const version = ({ vorpal, shutdown }: CLIArgs) => {
  vorpal.command('version', `Prints the ${name.title} version and exits.`).action(async () => {
    vorpal.activeCommand.log(pkg.version);

    shutdown({ exitCode: 0 });
  });
};
