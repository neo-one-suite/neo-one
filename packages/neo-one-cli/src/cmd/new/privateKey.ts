// tslint:disable no-console
import { createPrivateKey } from '@neo-one/client-common';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'private-key';
export const describe = 'Generate a new private key.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async () => {
    console.log(createPrivateKey());
  });
};
