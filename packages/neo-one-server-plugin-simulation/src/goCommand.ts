import { InteractiveCLIArgs, theme } from '@neo-one/server-plugin';

const runCommand = 'neo-one create simulation app @neo-one/simulation-react-template';
const startCommand = 'cd app && yarn install && yarn neo-one build && yarn start';
export const goCommand = ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal.command('go', 'NEO•ONE introduction.').action(async () => {
    cli.vorpal.log(`Welcome to ${theme.title}!`);
    cli.vorpal.log(`${theme.title} is currently in a preview state.`);
    cli.vorpal.log(
      `Follow us at ${theme.accent('https://twitter.com/neo_one_suite')} for frequent development updates!`,
    );
    cli.vorpal.log(`Like the project? Star us on github: ${theme.accent('https://github.com/neo-one-suite/neo-one')}.`);
    cli.vorpal.log(`Documentation is available at ${theme.accent('https://neo-one.io')}.`);
    cli.vorpal.log(`To get started with a barebones template app, run ${theme.command(runCommand)}`);
    cli.vorpal.log(
      `Once it's setup, run ${theme.command(
        startCommand,
      )} to build the example contracts and start the app. Check out the README for more info`,
    );
  });
