/* @flow */
import type { Command } from 'vorpal';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import {
  type CRUDBase,
  type CRUDResource,
  type CRUDResourceBase,
  type DescribeCRUD,
  DeleteCRUD,
  type GetCRUD,
  type Plugin,
  type TaskStatus,
  type InteractiveCLI,
  getTasksError,
  areTasksDone,
} from '@neo-one/server-plugin';

import chalk from 'chalk';
import cliTruncate from 'cli-truncate';
import elegantSpinner from 'elegant-spinner';
import figures from 'figures';
import indentString from 'indent-string';
import logSymbols from 'log-symbols';
import { map, switchMap, take } from 'rxjs/operators';
import stripAnsi from 'strip-ansi';
import { empty } from 'rxjs/observable/empty';
import logUpdate from 'log-update';
import { timer } from 'rxjs/observable/timer';

const pointer = chalk.yellow(figures.pointer);
const skipped = chalk.yellow(figures.arrowDown);

const addCommonResource = ({
  cli,
  command,
  crud,
}: {|
  cli: InteractiveCLI,
  command: Command,
  crud: CRUDResourceBase<*, *>,
|}) => {
  command.autocomplete({
    data: async () => crud.getCLIAutocomplete({ cli }),
  });
};

const addCommon = ({
  command,
  crud,
}: {|
  command: Command,
  crud: CRUDBase<*, *>,
|}) => {
  crud.options.forEach(({ option, description }) => {
    command.option(option, description);
  });

  crud.aliases.forEach(alias => {
    command.alias(alias);
  });
};

type Spinners = Object;

const getSymbol = (task: TaskStatus, spinners: Spinners) => {
  if (spinners[task.id] == null) {
    // eslint-disable-next-line
    spinners[task.id] = elegantSpinner();
  }

  const hasSubtasks = task.subtasks != null && task.subtasks.length > 0;
  if (task.pending) {
    return hasSubtasks ? pointer : chalk.yellow(spinners[task.id]());
  }

  if (task.complete) {
    return logSymbols.success;
  }

  if (task.error != null) {
    return hasSubtasks ? pointer : logSymbols.error;
  }

  if (task.skipped != null) {
    return skipped;
  }

  return ' ';
};

const renderTasks = (
  tasks: Array<TaskStatus>,
  spinners: Spinners,
  level: number = 0,
) => {
  let output = [];

  for (const task of tasks) {
    const skippedStr = task.skipped != null ? ` ${chalk.dim('[skipped]')}` : '';

    output.push(
      indentString(
        ` ${getSymbol(task, spinners)} ${task.title}${skippedStr}`,
        level,
        '  ',
      ),
    );

    if (
      (task.pending && task.message != null) ||
      task.skipped !== false ||
      task.error != null
    ) {
      let data = task.error;
      if (data == null && task.skipped !== false) {
        if (typeof task.skipped === 'string') {
          data = task.skipped;
        }
      } else if (data == null) {
        data = task.message;
      }

      if (data != null) {
        data = stripAnsi(
          data
            .trim()
            .split('\n')
            .filter(Boolean)
            .pop(),
        );
        const out = indentString(`${figures.arrowRight} ${data}`, level, '  ');
        output.push(
          // $FlowFixMe
          `   ${chalk.gray(cliTruncate(out, process.stdout.columns - 3))}`,
        );
      }
    }

    if (
      (task.pending || task.error != null || !task.collapse) &&
      task.subtasks != null &&
      task.subtasks.length > 0
    ) {
      output = output.concat(renderTasks(task.subtasks, spinners, level + 1));
    }
  }

  return output.join('\n');
};

const promptDelete = ({
  cli,
  crud,
  name,
}: {|
  cli: InteractiveCLI,
  crud: CRUDResource<*, *>,
  name: string,
|}) =>
  cli.prompt([
    {
      type: 'confirm',
      name: 'continue',
      default: false,
      message: `Are you sure you want to delete ${
        crud.resourceType.name
      } ${name}?`,
    },
  ]);

const createResource = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: CRUDResource<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .action(async args => {
      cancel$ = new ReplaySubject();

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
              if (error != null) {
                throw new Error(error);
              }
              return empty();
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

const createGet = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: GetCRUD<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async args => {
      const options = await crud.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });

      const resources$ = crud
        .getResources$({ client: cli.client, options })
        .pipe(
          map(resources => {
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
      const print$ = cancel$.pipe(
        switchMap(event => (event === 'cancel' ? empty() : resources$)),
      );

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

const createDescribe = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: DescribeCRUD<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async args => {
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
          map(resource => {
            if (resource == null) {
              throw new Error(
                `${resourceType.names.capital} ${args.name} does not exist`,
              );
            } else {
              const table = resourceType.getDescribeTable(resource);
              if (args.options.json) {
                cli.vorpal.activeCommand.log(JSON.stringify(table));
              } else {
                cli.printDescribe(table, logUpdate);
              }
            }
          }),
        );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(
        switchMap(event => (event === 'cancel' ? empty() : resource$)),
      );

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

export default ({ cli, plugin }: {| cli: InteractiveCLI, plugin: Plugin |}) => {
  const commands = [];
  for (const resourceType of plugin.resourceTypes) {
    const crud = resourceType.getCRUD();
    commands.push(createResource({ cli, crud: crud.create }));
    commands.push(createResource({ cli, crud: crud.delete }));
    if (crud.start != null) {
      commands.push(createResource({ cli, crud: crud.start }));
    }
    if (crud.stop != null) {
      commands.push(createResource({ cli, crud: crud.stop }));
    }
    commands.push(createGet({ cli, crud: crud.get }));
    commands.push(createDescribe({ cli, crud: crud.describe }));
  }

  return commands;
};
