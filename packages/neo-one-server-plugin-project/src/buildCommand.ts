import { handleCLITaskList, InteractiveCLIArgs } from '@neo-one/server-plugin';
import { mergeScanLatest } from '@neo-one/utils';
import { Observable, Observer, ReplaySubject, Subscription } from 'rxjs';
import { constants } from './constants';
import { loadProjectConfig } from './utils';

interface Options {
  readonly command: 'reset' | 'build';
  readonly rootDir: string;
}

const build = async (
  cli: InteractiveCLIArgs['cli'],
  cancel$: ReplaySubject<void>,
  progress: boolean,
  options: Options,
) => {
  const response$ = cli.client.executeTaskList$({
    plugin: constants.PLUGIN,
    options,
    cancel$,
  });

  await handleCLITaskList({ cli, response$, progress, cancel$ });
};

type Event = 'change';

const watchFiles$ = (dir: string): Observable<Event> =>
  new Observable((observer: Observer<Event>) => {
    // import('chokidar').FSWatcher
    // tslint:disable-next-line no-any
    let watcher: any | undefined;
    let closed = false;
    import('chokidar')
      .then((chokidar) => {
        if (!closed) {
          watcher = chokidar.watch(dir, { ignoreInitial: true });
          watcher.on('add', () => {
            observer.next('change');
          });
          watcher.on('change', () => {
            observer.next('change');
          });
          watcher.on('error', (error: Error) => {
            observer.error(error);
          });
          watcher.on('unlink', () => {
            observer.next('change');
          });
        }
      })
      .catch((error) => observer.error(error));

    return () => {
      closed = true;
      if (watcher !== undefined) {
        watcher.close();
      }
    };
  });

const doWatch = async (
  cli: InteractiveCLIArgs['cli'],
  progress: boolean,
  options: Options,
  watchCancel$: ReplaySubject<void>,
) => {
  let cancel$ = new ReplaySubject<void>();
  const projectConfig = await loadProjectConfig(options.rootDir);
  let cancelSubscription: Subscription | undefined;
  await new Promise<void>((resolve, reject) => {
    let subscription: Subscription | undefined = watchFiles$(projectConfig.paths.contracts)
      .pipe(
        mergeScanLatest(async () => {
          cancel$ = new ReplaySubject<void>();
          await build(cli, cancel$, progress, options);
        }),
      )
      .subscribe({
        complete: () => {
          resolve();
        },
        error: (error: Error) => {
          reject(error);
        },
      });

    cancelSubscription = watchCancel$.subscribe({
      next: () => {
        cancel$.next();
        if (subscription !== undefined) {
          subscription.unsubscribe();
          subscription = undefined;
        }
      },
      complete: () => {
        resolve();
      },
    });
  });
  if (cancelSubscription !== undefined) {
    cancelSubscription.unsubscribe();
  }
};

export const buildCommand = ({ cli }: InteractiveCLIArgs) => {
  let cancel$ = new ReplaySubject<void>();
  let watchCancel$ = new ReplaySubject<void>();

  return cli.vorpal
    .command('build', 'Build NEO•ONE project.')
    .option('--no-progress', "Don't output progress. Typically used for CI scenarios")
    .option('--reset', "Reset the local development environment of a NEO•ONE project to it's original state.")
    .option('--watch', 'Watch contracts for changes and rebuild.')
    .action(async (args) => {
      cancel$ = new ReplaySubject<void>();
      watchCancel$ = new ReplaySubject<void>();
      const reset = args.options.reset !== undefined && args.options.reset;
      const watch = args.options.watch !== undefined && args.options.watch;
      const progress = args.options.progress === undefined || args.options.progress;
      const options: Options = {
        command: reset ? 'reset' : 'build',
        rootDir: process.cwd(),
      };
      if (watch) {
        await build(cli, cancel$, progress, options);
        await doWatch(cli, progress, options, watchCancel$);
      } else {
        await build(cli, cancel$, progress, options);
      }
    })
    .cancel(() => {
      cancel$.next();
      watchCancel$.next();
    });
};
