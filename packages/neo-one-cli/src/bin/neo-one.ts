// tslint:disable-next-line no-implicit-dependencies
import { cmd } from '@neo-one/cli';
import yargs from 'yargs';

// tslint:disable-next-line no-unused-expression
cmd
  .builder(yargs)
  .usage(cmd.describe)
  .demandCommand()
  .scriptName(cmd.command)
  .help('help').argv;
