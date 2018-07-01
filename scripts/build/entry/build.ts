import * as yargs from 'yargs';

import { buildJavascript, pkgs } from '../common';

yargs
  .alias('p', 'package')
  .describe('p', 'package to watch')
  .choices('p', pkgs);

buildJavascript(yargs.argv.p)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // tslint:disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
