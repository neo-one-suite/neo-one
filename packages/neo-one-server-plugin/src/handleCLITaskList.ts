import { utils } from '@neo-one/utils';
import chalk from 'chalk';
import cliTruncate from 'cli-truncate';
import figures from 'figures';
import * as logSymbols from 'log-symbols';
import logUpdate from 'log-update';
import ora from 'ora';
import { EMPTY, Observable, Subject, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { indentString, stripAnsi } from './displayUtils';
import { areTasksDone, getTasksError } from './tasks';
import { InteractiveCLI, TaskStatus } from './types';

// tslint:disable-next-line no-any
type Spinners = any;

const pointer = chalk.yellow(figures.pointer);
const skipped = chalk.yellow(figures.arrowDown);

const getSymbol = (task: TaskStatus, mutableSpinners: Spinners) => {
  if (mutableSpinners[task.id] == undefined) {
    const spinner = ora({ color: 'yellow' });
    mutableSpinners[task.id] = spinner;
  }

  const hasSubtasks = task.subtasks !== undefined && task.subtasks.length > 0;
  if (task.pending) {
    return hasSubtasks ? pointer : chalk.yellow(mutableSpinners[task.id].frame().trim());
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

const renderTasks = (tasks: readonly TaskStatus[], spinners: Spinners, level = 0): string => {
  let mutableOutput: string[] = [];

  tasks.forEach((task) => {
    const skippedStr = task.skipped !== undefined ? ` ${chalk.dim('[skipped]')}` : '';

    mutableOutput.push(
      indentString(` ${getSymbol(task, spinners)} ${task.title}${skippedStr}`, level, { indent: '  ' }),
    );

    if (
      (task.pending && task.message !== undefined) ||
      task.skipped !== false ||
      task.error !== undefined ||
      task.message !== undefined
    ) {
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

        const out = indentString(`${figures.arrowRight} ${data}`, level, { indent: '  ' });
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

export const handleCLITaskList = async ({
  cli,
  response$,
  progress,
  cancel$,
}: {
  readonly cli: InteractiveCLI;
  // tslint:disable-next-line no-any
  readonly response$: Observable<any>;
  readonly progress: boolean;
  readonly cancel$: Subject<void>;
}): Promise<void> => {
  const spinners = {};
  await response$
    .pipe(
      switchMap(({ tasks }) => {
        if (areTasksDone(tasks)) {
          if (progress) {
            logUpdate(renderTasks(tasks, spinners));
            logUpdate.done();
          } else {
            cli.print(renderTasks(tasks, spinners));
          }

          cancel$.complete();
          const error = getTasksError(tasks);
          if (error !== undefined) {
            throw new Error(error);
          }

          return EMPTY;
        }

        if (progress) {
          return timer(0, 50).pipe(
            map(() => {
              logUpdate(renderTasks(tasks, spinners));
            }),
          );
        }

        return EMPTY;
      }),
    )
    .toPromise();
};
