import { Plugin } from '@neo-one/server-plugin';
import { labels } from '@neo-one/utils';
import ora from 'ora';
import { InteractiveCLI } from '../InteractiveCLI';
import { createCRUD } from './createCRUD';

export const createPlugin = ({ cli, plugin }: { readonly cli: InteractiveCLI; readonly plugin: Plugin }) => {
  const commands = createCRUD({ cli, plugin }).concat(
    plugin.interactive.map((interactiveCommand) => interactiveCommand({ cli })),
  );

  commands.forEach((command) => {
    const fn = command.fn;
    let cancelled = false;
    command.action(async (args) => {
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
      }
    });

    const cancel = command.cancel;
    if (cancel != undefined) {
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
