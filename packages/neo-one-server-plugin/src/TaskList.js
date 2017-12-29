/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subscription } from 'rxjs/Subscription';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators/map';

import type { TaskStatus } from './types';

import { getTaskError, getTasksError, isTaskDone } from './tasks';

// flowlint-next-line unclear-type:off
export type TaskContext = Object;
type SkipFn = (ctx: TaskContext) => string | boolean;
type EnabledFn = (ctx: TaskContext) => boolean;
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
  onError?: (error: Error) => void,
  onComplete?: () => void,
  onDone?: () => void,
|};

class TaskWrapper {
  _task: Task;
  _taskList: TaskList;

  _skip: SkipFn;
  _enabled: EnabledFn;

  status$: BehaviorSubject<?TaskStatus>;

  constructor(task: Task, taskList: TaskList) {
    this._task = task;
    this._taskList = taskList;
    this.status$ = new BehaviorSubject({
      id: task.title,
      title: task.title,
    });

    // eslint-disable-next-line
    this._skip = task.skip || ((ctx: TaskContext) => false);
    // eslint-disable-next-line
    this._enabled = task.enabled || ((ctx: TaskContext) => true);
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
    const status = this.status$.getValue();
    if (status != null) {
      this.status$.next({ ...status, skipped: 'Aborted' });
    }
  }

  async run(ctx: TaskContext): Promise<void> {
    const statusIn = this.status$.getValue();
    if (statusIn == null) {
      this.status$.complete();
      return;
    }
    const status = { ...statusIn, pending: true };

    const skip = this._skip(ctx);
    if (skip !== false) {
      this.status$.next({ ...status, pending: false, skipped: skip });
    } else {
      this.status$.next(status);
      try {
        const result = this._task.task(ctx);

        if (result instanceof Observable) {
          await result
            .pipe(
              map(message => {
                this.status$.next({ ...status, message });
              }),
            )
            .toPromise();
        } else if (result instanceof Promise) {
          await result;
          // eslint-disable-next-line
        } else if (result instanceof TaskList) {
          result.setOnError(this._taskList.onError);
          result._run(ctx);
          await result.status$
            .pipe(
              map(subtasks => {
                this.status$.next({ ...status, subtasks });
              }),
            )
            .toPromise();
        }
        this.status$.next({ ...status, pending: false, complete: true });
      } catch (error) {
        this._taskList.onError(error);
        this.status$.next({ ...status, pending: false, error: error.message });
      }
    }

    this.status$.complete();
  }
}

export default class TaskList {
  _tasks: Array<TaskWrapper>;
  _concurrent: boolean;
  onError: (error: Error) => void;
  _onComplete: () => void;
  _onDone: () => void;

  _status$: ReplaySubject<Array<TaskStatus>>;
  _subscription: ?Subscription;
  _aborted: boolean;

  constructor({
    tasks,
    concurrent,
    onError,
    onComplete,
    onDone,
  }: TaskListOptions) {
    this._tasks = tasks.map(task => new TaskWrapper(task, this));
    this._concurrent = concurrent || false;
    // eslint-disable-next-line
    this.onError = onError || ((error: Error) => {});
    this._onComplete = onComplete || (() => {});
    this._onDone = onDone || (() => {});

    this._status$ = new ReplaySubject(1);

    this._subscription = null;
    this._aborted = false;
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
    this._aborted = true;
    return this._status$;
  }

  setOnError(onError: (error: Error) => void): void {
    this.onError = onError;
  }

  async _run(ctxIn?: TaskContext): Promise<void> {
    if (this._subscription != null) {
      return;
    }

    const ctx = ctxIn || {};
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
    this._onDone();
  }

  async _runTasks(ctx: TaskContext): Promise<void> {
    if (this._concurrent) {
      await Promise.all(this._tasks.map(task => task.run(ctx)));
    } else {
      for (const task of this._tasks) {
        if (this._aborted) {
          task.abort();
        } else {
          // eslint-disable-next-line
          await task.run(ctx);
          if (task.error != null) {
            break;
          }
        }
      }
    }
  }

  _checkAll(ctx: TaskContext): void {
    this._tasks.forEach(task => task.check(ctx));
  }
}
