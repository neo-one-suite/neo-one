/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subscription } from 'rxjs/Subscription';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators/map';

import type { TaskStatus } from './types';

import { getTaskError, getTasksError, isTaskDone } from './tasks';

export type TaskContext = Object;
type SkipFn = (ctx: TaskContext) => string | boolean;
type EnabledFn = (ctx: TaskContext) => boolean;
type OnErrorFn = (error: Error, ctx: TaskContext) => void;
type OnDoneFn = (failed: boolean) => void;
export type Task = {|
  skip?: SkipFn,
  enabled?: EnabledFn,
  task: (
    ctx: TaskContext,
    // eslint-disable-next-line
  ) => Promise<void> | Observable<string> | TaskList | void,
  title: string,
|};

export type TaskListOptions = {|
  tasks: Array<Task>,
  concurrent?: boolean,
  onError?: OnErrorFn,
  onComplete?: () => void,
  onDone?: OnDoneFn,
  initialContext?: TaskContext,
  freshContext?: boolean,
  collapse?: boolean,
|};

class TaskWrapper {
  _task: Task;
  _taskList: TaskList;

  _skip: SkipFn;
  _enabled: EnabledFn;
  _aborted: boolean;

  status$: BehaviorSubject<?TaskStatus>;

  constructor({
    task,
    taskList,
    collapse,
  }: {|
    task: Task,
    taskList: TaskList,
    collapse: boolean,
  |}) {
    this._task = task;
    this._taskList = taskList;
    this.status$ = new BehaviorSubject({
      id: task.title,
      title: task.title,
      collapse,
    });

    // eslint-disable-next-line
    this._skip = task.skip || ((ctx: TaskContext) => false);
    // eslint-disable-next-line
    this._enabled = task.enabled || ((ctx: TaskContext) => true);
    this._aborted = false;
  }

  check(ctx: TaskContext): void {
    if (this.enabled && !this.pending && !this.done && !this._enabled(ctx)) {
      this.status$.next(null);
    }
  }

  get enabled(): boolean {
    return this.status$.getValue() != null;
  }

  get pending(): boolean {
    const status = this.status$.getValue();
    return status != null && status.pending === true;
  }

  get done(): boolean {
    const status = this.status$.getValue();
    return status != null && isTaskDone(status);
  }

  get error(): ?string {
    const status = this.status$.getValue();
    return status == null ? null : getTaskError(status);
  }

  abort(): void {
    this._aborted = true;
    const status = this.status$.getValue();
    if (status != null) {
      this.status$.next({ ...status, skipped: 'Aborted' });
    }
    this.status$.complete();
  }

  complete(): void {
    this.status$.complete();
  }

  async run(ctx: TaskContext): Promise<void> {
    const statusIn = this.status$.getValue();
    if (statusIn == null) {
      this.status$.complete();
      return;
    }
    if (this._aborted) {
      return;
    }

    let status = { ...statusIn, pending: true };

    const onError = (error: Error) => {
      this._taskList.onError(error, ctx);
      this._taskList.superOnError(error);
    };

    try {
      const skip = this._skip(ctx);
      if (skip !== false) {
        status = { ...status, pending: false, skipped: skip };
        this.status$.next(status);
      } else {
        this.status$.next(status);

        const result = this._task.task(ctx);

        let error;
        if (result instanceof Observable) {
          await result
            .pipe(
              map(message => {
                status = { ...status, message };
                this.status$.next(status);
              }),
            )
            .toPromise();
        } else if (result instanceof Promise) {
          await result;
          // eslint-disable-next-line
        } else if (result instanceof TaskList) {
          result.setSuperOnError(onError);
          result._run(ctx);
          const finalSubtasks = await result.status$
            .pipe(
              map(subtasks => {
                status = { ...status, subtasks };
                this.status$.next(status);
                return subtasks;
              }),
            )
            .toPromise();
          error = getTasksError(finalSubtasks);
        }

        this.status$.next({
          ...status,
          pending: false,
          complete: error == null,
          error: error == null ? undefined : error,
        });
      }
    } catch (error) {
      this.status$.next({
        ...status,
        pending: false,
        error:
          error.message == null || error.message === ''
            ? 'Something went wrong.'
            : error.message,
      });
      onError(error);
    }

    this.status$.complete();
  }
}

export default class TaskList {
  _tasks: Array<TaskWrapper>;
  _concurrent: boolean;
  onError: OnErrorFn;
  _onComplete: () => void;
  _onDone: OnDoneFn;
  _initialContext: TaskContext;
  _freshContext: boolean;
  _collapse: boolean;
  superOnError: (error: Error) => void;

  _status$: ReplaySubject<Array<TaskStatus>>;
  _subscription: ?Subscription;

  constructor({
    tasks,
    concurrent,
    onError,
    onComplete,
    onDone,
    initialContext,
    freshContext,
    collapse: collapseIn,
  }: TaskListOptions) {
    const collapse = collapseIn == null ? true : collapseIn;
    this._tasks = tasks.map(
      task =>
        new TaskWrapper({
          task,
          taskList: this,
          collapse,
        }),
    );
    this._concurrent = concurrent || false;
    // eslint-disable-next-line
    this.onError = onError || ((error: Error, ctx: TaskContext) => {});
    this._onComplete = onComplete || (() => {});
    // eslint-disable-next-line
    this._onDone = onDone || ((failed: boolean) => {});
    this._initialContext = initialContext || {};
    this._freshContext = freshContext || false;
    // eslint-disable-next-line
    this.superOnError = (error: Error) => {};

    this._status$ = new ReplaySubject(1);

    this._subscription = null;
  }

  get status$(): Observable<Array<TaskStatus>> {
    this._run();
    return this._status$;
  }

  async toPromise(): Promise<void> {
    await this.status$.toPromise();
  }

  async abort(): Promise<void> {
    await this.abort$().toPromise();
  }

  abort$(): Observable<Array<TaskStatus>> {
    for (const task of this._tasks) {
      task.abort();
    }
    return this.status$;
  }

  setSuperOnError(onError: (error: Error) => void): void {
    this.superOnError = onError;
  }

  async _run(ctxIn?: TaskContext): Promise<void> {
    if (this._subscription != null) {
      return;
    }

    let ctx = ctxIn || {};
    if (this._freshContext) {
      ctx = {};
    }

    for (const key of Object.keys(this._initialContext)) {
      ctx[key] = this._initialContext[key];
    }
    this._checkAll(ctx);

    this._subscription = combineLatest(this._tasks.map(task => task.status$))
      .pipe(map(statuses => statuses.filter(Boolean)))
      .subscribe(this._status$);

    await this._runTasks(ctx);
    const err = getTasksError(
      this._tasks.map(task => task.status$.getValue()).filter(Boolean),
    );
    if (err == null) {
      this._onComplete();
    }
    this._onDone(err != null);
  }

  async _runTasks(ctx: TaskContext): Promise<void> {
    if (this._concurrent) {
      await Promise.all(this._tasks.map(task => task.run(ctx)));
    } else {
      let error;
      for (const task of this._tasks) {
        if (error == null) {
          // eslint-disable-next-line
          await task.run(ctx);
        } else {
          task.complete();
        }
        // eslint-disable-next-line
        error = task.error;
      }
    }
  }

  _checkAll(ctx: TaskContext): void {
    this._tasks.forEach(task => task.check(ctx));
  }
}
