import { Plugin } from '@neo-one/server-plugin';
import { labels } from '@neo-one/utils';
import ora from 'ora';
import { InteractiveCLI } from '../InteractiveCLI';
import { createCRUD } from './createCRUD';

export const createPlugin = ({ cli, plugin }: { readonly cli: InteractiveCLI; readonly plugin: Plugin }) => {
  const commands = createCRUD({ cli, plugin }).concat(
    plugin.interactive.map((interactiveCommand) => interactiveCommand({ cli })),
  );

  // tslint:disable-next-line no-any
  commands.forEach((command: any) => {
    const fn = command._fn;
    let cancelled = false;
    // tslint:disable-next-line no-any
    command.action(async (args: any) => {
      try {
        cancelled = false;
        await cli.executeCommandPreHooks(command.name, args);
        await fn(args);
        if (!cancelled) {
          await cli.executeCommandPostHooks(command.name, args);
        }
      } catch (error) {
        ora(error.message).fail();
        cli.monitor.withLabels({ [labels.COMMAND_NAME]: command.name }).logError({
          name: 'neo_command_error',
          error,
          message: `Command ${command.name} failed.`,
        });

        if (cli.throwError) {
          throw error;
        }
      }
    });

    const cancel = command.cancel;
    if (cancel !== undefined) {
      command.cancel(() => {
        cancelled = true;
        cancel();
      });
    }
  });

  plugin.cliPreHooks.forEach(({ name, hook }) => {
    cli.registerPreHook(name, hook);
  });

  plugin.cliPostHooks.forEach(({ name, hook }) => {
    cli.registerPostHook(name, hook);
  });
};
