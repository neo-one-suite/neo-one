import { TaskStatus } from './types';

export const getTaskError = (task: TaskStatus): string | undefined =>
  task.subtasks !== undefined ? getTasksError(task.subtasks) : task.error;

export const getTasksError = (tasks: ReadonlyArray<TaskStatus>): string | undefined =>
  tasks.map(getTaskError).filter((value) => value !== undefined)[0];

export const isTaskDone = (task: TaskStatus): boolean =>
  getTaskError(task) !== undefined || task.skipped !== undefined || task.complete === true;

export const areTasksDone = (tasks: ReadonlyArray<TaskStatus>): boolean =>
  getTasksError(tasks) !== undefined || tasks.every((task) => task.skipped !== undefined || task.complete === true);

export const skipAllTasks = (tasks: ReadonlyArray<TaskStatus>, reason: string): ReadonlyArray<TaskStatus> =>
  tasks.map((task) => {
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
      subtasks: task.subtasks === undefined ? undefined : skipAllTasks(task.subtasks, reason),
      skipped: reason,
      collapse: task.collapse,
    };
  });
