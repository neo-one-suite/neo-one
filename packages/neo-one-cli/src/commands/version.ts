import { CLIArgs, name, VERSION } from '@neo-one/server-plugin';

export const version = ({ vorpal, shutdown }: CLIArgs) => {
  vorpal.command('version', `Prints the ${name.title} version and exits.`).action(async () => {
    vorpal.activeCommand.log(VERSION);

    shutdown({ exitCode: 0 });
  });
};
