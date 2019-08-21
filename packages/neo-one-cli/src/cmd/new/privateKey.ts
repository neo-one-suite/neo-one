// tslint:disable no-console
import { createPrivateKey, privateKeyToAddress, privateKeyToWIF } from '@neo-one/client';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'private-key';
export const describe = 'Generate a new private key.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async () => {
    const privateKey = createPrivateKey();
    console.log(privateKey);
    console.log(privateKeyToWIF(privateKey));
    console.log(privateKeyToAddress(privateKey));
  });
};
