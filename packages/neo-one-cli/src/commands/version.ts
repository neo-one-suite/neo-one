import { CLIArgs, name } from '@neo-one/server-plugin';

export const version = ({ vorpal, shutdown }: CLIArgs) => {
  vorpal.command('version', `Prints the ${name.title} version and exits.`).action(async () => {
    vorpal.activeCommand.log('1.0.0-alpha');

    shutdown({ exitCode: 0 });
  });
};
