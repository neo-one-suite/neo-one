/* @flow */
import type { TaskStatus } from './types';

export const getTaskError = (task: TaskStatus): ?string =>
  task.subtasks != null
    ? // eslint-disable-next-line
      getTasksError(task.subtasks)
    : task.error;

export const getTasksError = (tasks: Array<TaskStatus>): ?string =>
  tasks.map(task => getTaskError(task)).filter(value => value != null)[0];

export const isTaskDone = (task: TaskStatus): boolean =>
  getTaskError(task) != null || task.skipped != null || task.complete === true;

export const areTasksDone = (tasks: Array<TaskStatus>): boolean =>
  getTasksError(tasks) != null ||
  tasks.every(task => task.skipped != null || task.complete);

export const skipAllTasks = (
  tasks: Array<TaskStatus>,
  reason: string,
): Array<TaskStatus> =>
  tasks.map(task => {
    if (isTaskDone(task)) {
      return task;
    }

    return {
      id: task.id,
      title: task.title,
      message: task.message,
      pending: task.pending,
      complete: task.complete,
      error: task.error,
      subtasks:
        task.subtasks == null ? undefined : skipAllTasks(task.subtasks, reason),
      skipped: reason,
      collapse: task.collapse,
    };
  });
