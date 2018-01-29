/* @flow */
import { type InteractiveCLIArgs, theme } from '@neo-one/server-plugin';

const runCommand = 'neo-one create simulation app @neo-one/simulation-react';
const startCommand = 'cd app && npm start';
export default ({ cli }: InteractiveCLIArgs) => {
  const command = cli.vorpal
    .command('go', 'NEO•ONE introduction.')
    .action(async () => {
      cli.vorpal.log(`Welcome to ${theme.title}!`);
      cli.vorpal.log(
        `${theme.title} is currently in an early alpha state. ` +
          'Some features are not implemented and there may be unexpected bugs.',
      );
      cli.vorpal.log(
        `Follow us at ${theme.accent('https://twitter.com/neo_one_suite')} ` +
          'for frequent development updates!',
      );
      cli.vorpal.log(
        'Like the project? Star us on github: ' +
          `${theme.accent('https://github.com/neo-one-suite/neo-one')}.`,
      );
      cli.vorpal.log(
        'Documentation is available at ' +
          `${theme.accent('https://neo-one.io')}.`,
      );
      cli.vorpal.log(
        `To get started with a react template app, run ` +
          `${theme.command(runCommand)}`,
      );
      cli.vorpal.log(
        `Once it's setup, run ${theme.command(startCommand)} to start ` +
          'the app!',
      );
    });

  return command;
};
