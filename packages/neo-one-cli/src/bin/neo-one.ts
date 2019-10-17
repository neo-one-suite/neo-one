// tslint:disable-next-line no-implicit-dependencies
import yargs from 'yargs';
import * as cmd from '../cmd';

// tslint:disable-next-line no-unused-expression
cmd
  .builder(yargs)
  .usage(cmd.describe)
  .demandCommand()
  .scriptName(cmd.command)
  .help('help').argv;
