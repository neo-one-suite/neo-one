import { handleCLITaskList, InteractiveCLIArgs } from '@neo-one/server-plugin';
import { ReplaySubject } from 'rxjs';
import { constants } from './constants';

export const buildCommand = ({ cli }: InteractiveCLIArgs) => {
  let cancel$ = new ReplaySubject<void>();

  return cli.vorpal
    .command('build', 'Build NEO•ONE project.')
    .option('--no-progress', "Don't output progress. Typically used for CI scenarios")
    .option('--reset', "Reset the local development environment of a NEO•ONE project to it's original state.")
    .action(async (args) => {
      cancel$ = new ReplaySubject<void>();
      const reset = args.options.reset !== undefined && args.options.reset;
      const response$ = cli.client.executeTaskList$({
        plugin: constants.PLUGIN,
        options: {
          command: reset ? 'reset' : 'build',
          rootDir: process.cwd(),
        },
        cancel$,
      });

      const progress = args.options.progress === undefined || args.options.progress;
      await handleCLITaskList({ cli, response$, progress, cancel$ });
    })
    .cancel(() => {
      cancel$.next();
    });
};
