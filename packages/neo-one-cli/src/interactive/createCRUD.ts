import {
  areTasksDone,
  CRUDBase,
  CRUDResource,
  CRUDResourceBase,
  DeleteCRUD,
  DescribeCRUD,
  GetCRUD,
  getTasksError,
  InteractiveCLI,
  Plugin,
  TaskStatus,
} from '@neo-one/server-plugin';
import { utils } from '@neo-one/utils';
import chalk from 'chalk';
import cliTruncate from 'cli-truncate';
import elegantSpinner from 'elegant-spinner';
import figures from 'figures';
// tslint:disable-next-line match-default-export-name
import indentString from 'indent-string';
import logSymbols from 'log-symbols';
import logUpdate from 'log-update';
import { EMPTY, ReplaySubject, timer } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
// tslint:disable-next-line match-default-export-name
import stripAnsi from 'strip-ansi';
import { Command } from 'vorpal';

const pointer = chalk.yellow(figures.pointer);
const skipped = chalk.yellow(figures.arrowDown);

const addCommonResource = ({
  cli,
  command,
  crud,
}: {
  readonly cli: InteractiveCLI;
  readonly command: Command;
  readonly crud: CRUDResourceBase;
}) => {
  command.autocomplete({
    data: async () => crud.getCLIAutocomplete({ cli }),
  });
};

const addCommon = ({ command, crud }: { readonly command: Command; readonly crud: CRUDBase }) => {
  crud.options.forEach(({ option, description }) => {
    command.option(option, description);
  });

  crud.aliases.forEach((alias) => {
    command.alias(alias);
  });
};
// tslint:disable-next-line no-any
type Spinners = any;

const getSymbol = (task: TaskStatus, mutableSpinners: Spinners) => {
  if (mutableSpinners[task.id] == undefined) {
    mutableSpinners[task.id] = elegantSpinner();
  }

  const hasSubtasks = task.subtasks !== undefined && task.subtasks.length > 0;
  if (task.pending) {
    return hasSubtasks ? pointer : chalk.yellow(mutableSpinners[task.id]());
  }

  if (task.complete) {
    return logSymbols.success;
  }

  if (task.error !== undefined) {
    return hasSubtasks ? pointer : logSymbols.error;
  }

  if (task.skipped !== undefined) {
    return skipped;
  }

  return ' ';
};

const renderTasks = (tasks: ReadonlyArray<TaskStatus>, spinners: Spinners, level = 0): string => {
  let mutableOutput: string[] = [];

  tasks.forEach((task) => {
    const skippedStr = task.skipped !== undefined ? ` ${chalk.dim('[skipped]')}` : '';

    mutableOutput.push(indentString(` ${getSymbol(task, spinners)} ${task.title}${skippedStr}`, level, '  '));

    if ((task.pending && task.message !== undefined) || task.skipped !== false || task.error !== undefined) {
      let data = task.error;
      if (data === undefined && task.skipped !== false) {
        if (typeof task.skipped === 'string') {
          data = task.skipped;
        }
      } else if (data === undefined) {
        data = task.message;
      }

      if (data !== undefined) {
        data = stripAnsi(
          data
            .trim()
            .split('\n')
            .filter(utils.notNull)[0],
        );

        const out = indentString(`${figures.arrowRight} ${data}`, level, '  ');
        mutableOutput.push(`   ${chalk.gray(cliTruncate(out, (process.stdout.columns as number) - 3))}`);
      }
    }

    if (
      (task.pending || task.error !== undefined || !task.collapse) &&
      task.subtasks !== undefined &&
      task.subtasks.length > 0
    ) {
      mutableOutput = mutableOutput.concat(renderTasks(task.subtasks, spinners, level + 1));
    }
  });

  return mutableOutput.join('\n');
};

const promptDelete = async ({
  cli,
  crud,
  name,
}: {
  readonly cli: InteractiveCLI;
  readonly crud: CRUDResource;
  readonly name: string;
}) =>
  cli.prompt([
    {
      type: 'confirm',
      name: 'continue',
      default: false,
      message: `Are you sure you want to delete ${crud.resourceType.name} ${name}?`,
    },
  ]);

const createResource = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: CRUDResource }) => {
  let cancel$ = new ReplaySubject<void>();
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .action(async (args) => {
      cancel$ = new ReplaySubject<void>();

      if (crud instanceof DeleteCRUD) {
        const response = await promptDelete({
          cli,
          crud,
          name: args.name,
        });

        if (!response.continue) {
          cli.vorpal.activeCommand.log('Aborting...');

          return;
        }
      }

      const options = await crud.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });

      const name = await crud.getCLIName({
        baseName: args.name,
        cli,
        options,
      });

      const response$ = crud.request$({
        name,
        cancel$,
        options,
        client: cli.client,
      });

      await crud.preExecCLI({ name, cli, options });

      const spinners = {};
      await response$
        .pipe(
          switchMap(({ tasks }) => {
            if (areTasksDone(tasks)) {
              logUpdate(renderTasks(tasks, spinners));
              logUpdate.done();
              cancel$.complete();
              const error = getTasksError(tasks);
              if (error !== undefined) {
                throw new Error(error);
              }

              return EMPTY;
            }

            return timer(0, 50).pipe(
              map(() => {
                logUpdate(renderTasks(tasks, spinners));
              }),
            );
          }),
        )
        .toPromise();

      await crud.postExecCLI({ name, cli, options });
    })
    .cancel(() => {
      cancel$.next();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  return command;
};
const createGet = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: GetCRUD }) => {
  let cancel$ = new ReplaySubject<string>();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async (args) => {
      const options = await crud.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });

      const resources$ = crud.getResources$({ client: cli.client, options }).pipe(
        map((resources) => {
          const table = resourceType.getListTable(resources);
          if (args.options.json) {
            cli.vorpal.activeCommand.log(JSON.stringify(table));
          } else {
            cli.printList(table, logUpdate);
          }
        }),
      );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(switchMap((event) => (event === 'cancel' ? EMPTY : resources$)));

      await crud.preExecCLI({ cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ cli, options });

      logUpdate.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });

  return command;
};
const createDescribe = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: DescribeCRUD }) => {
  let cancel$ = new ReplaySubject<string>();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async (args) => {
      const options = await crud.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });

      const name = await crud.getCLIName({
        baseName: args.name,
        cli,
        options,
      });

      const resource$ = resourceType
        .getResource$({
          name,
          client: cli.client,
          options,
        })
        .pipe(
          map((resource) => {
            if (resource === undefined) {
              throw new Error(`${resourceType.names.capital} ${args.name} does not exist`);
            }
            const table = resourceType.getDescribeTable(resource);
            if (args.options.json) {
              cli.vorpal.activeCommand.log(JSON.stringify(table));
            } else {
              cli.printDescribe(table, logUpdate);
            }
          }),
        );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(switchMap((event) => (event === 'cancel' ? EMPTY : resource$)));

      await crud.preExecCLI({ name, cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ name, cli, options });

      logUpdate.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  return command;
};

export const createCRUD = ({ cli, plugin }: { readonly cli: InteractiveCLI; readonly plugin: Plugin }) => {
  const mutableCommands: Command[] = [];
  plugin.resourceTypes.forEach((resourceType) => {
    const crud = resourceType.getCRUD();
    mutableCommands.push(createResource({ cli, crud: crud.create }));
    mutableCommands.push(createResource({ cli, crud: crud.delete }));
    if (crud.start !== undefined) {
      mutableCommands.push(createResource({ cli, crud: crud.start }));
    }
    if (crud.stop !== undefined) {
      mutableCommands.push(createResource({ cli, crud: crud.stop }));
    }
    mutableCommands.push(createGet({ cli, crud: crud.get }));
    mutableCommands.push(createDescribe({ cli, crud: crud.describe }));
  });

  return mutableCommands;
};
