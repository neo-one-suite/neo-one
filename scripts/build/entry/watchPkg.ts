import * as yargs from 'yargs';

import { pkgs, watchJavascriptPkg } from '../common';

yargs
  .alias('p', 'package')
  .describe('p', 'package to watch')
  .choices('p', pkgs);

watchJavascriptPkg(yargs.argv.p).catch((error) => {
  // tslint:disable-next-line no-console
  console.error(error);
  process.exit(1);
});
