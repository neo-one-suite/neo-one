import yargs from 'yargs';
import * as build from './build';
import * as compile from './compile';
import * as consoleCmd from './console';
import * as convert from './convert';
import * as deploy from './deploy';
import * as generate from './generate';
import * as info from './info';
import * as init from './init';
import * as newCmd from './new';
import * as start from './start';
import * as stop from './stop';

export const command = 'neo-one';
export const describe = 'NEO•ONE CLI.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .command(convert.command, convert.describe, convert.builder)
    .command(newCmd.command, newCmd.describe, newCmd.builder)
    .command(start.command, start.describe, start.builder)
    .command(stop.command, stop.describe, stop.builder)
    .command(build)
    .command(consoleCmd)
    .command(deploy)
    .command(info)
    .command(compile)
    .command(init)
    .command(generate);
