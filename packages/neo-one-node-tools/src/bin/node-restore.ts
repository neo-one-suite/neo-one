import yargs from 'yargs';
import * as cmd from '../cmd';

const { command } = cmd;
// tslint:disable-next-line no-unused-expression
yargs
  .command({
    ...cmd,
    command: ['$0'].concat(command.split(' ').slice(1)).join(' '),
  })
  .scriptName(command.split(' ')[0])
  .help('help').argv;
