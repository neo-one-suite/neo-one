/* @flow */
import type { Binary } from '@neo-one/server-plugin';

import { STATIC_NEO_ONE_OPTION } from '../constants';

export default (argv: Array<string>): Binary => ({
  cmd: argv[0],
  firstArgs: [argv[1], STATIC_NEO_ONE_OPTION],
});
