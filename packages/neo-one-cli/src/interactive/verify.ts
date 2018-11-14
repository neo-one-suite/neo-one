import { name } from '@neo-one/server-plugin';
import { InteractiveCLI } from '../InteractiveCLI';

export const verify = (cli: InteractiveCLI) => {
  cli.vorpal.command('verify', `Verifies the ${name.title} installation.`).action(async () => {
    const ready = await cli.client.verify();
    if (ready) {
      cli.vorpal.activeCommand.log(`${name.title} verified, you're all set!`);
    } else {
      cli.vorpal.activeCommand.log(`Something went wrong with ${name.title}.`);
    }
  });
};
