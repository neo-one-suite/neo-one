import { utils } from '@neo-one/utils';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { getTaskError, getTasksError, isTaskDone } from './tasks';
import { TaskStatus } from './types';

export type TaskContext = object;
type SkipFn = (ctx: TaskContext) => string | boolean;
type EnabledFn = (ctx: TaskContext) => boolean;
type OnErrorFn = (error: Error, ctx: TaskContext) => void;
type OnDoneFn = (failed: boolean) => void;

export interface Task {
  readonly skip?: SkipFn;
  readonly enabled?: EnabledFn;
  readonly task: (ctx: TaskContext) => Promise<void> | Observable<string> | TaskList | void;
  readonly title: string;
}

export interface TaskListOptions {
  readonly tasks: ReadonlyArray<Task>;
  readonly concurrent?: boolean;
  readonly onError?: OnErrorFn;
  readonly onComplete?: () => void;
  readonly onDone?: OnDoneFn;
  readonly initialContext?: TaskContext;
  readonly freshContext?: boolean;
  readonly collapse?: boolean;
}

class TaskWrapper {
  public readonly status$: BehaviorSubject<TaskStatus | undefined>;
  private readonly task: Task;
  private readonly taskList: TaskList;
  private readonly skip: SkipFn;
  private readonly getEnabled: EnabledFn;
  private mutableAborted: boolean;

  public constructor({
    task,
    taskList,
    collapse,
  }: {
    readonly task: Task;
    readonly taskList: TaskList;
    readonly collapse: boolean;
  }) {
    this.task = task;
    this.taskList = taskList;
    this.status$ = new BehaviorSubject<TaskStatus | undefined>({
      id: task.title,
      title: task.title,
      collapse,
    });

    // tslint:disable-next-line no-unused
    this.skip = task.skip === undefined ? (ctx) => false : task.skip;
    // tslint:disable-next-line no-unused
    this.getEnabled = task.enabled === undefined ? (ctx) => true : task.enabled;
    this.mutableAborted = false;
  }

  public check(ctx: TaskContext): void {
    if (this.enabled && !this.pending && !this.done && !this.getEnabled(ctx)) {
      this.status$.next(undefined);
    }
  }

  public get enabled(): boolean {
    return this.status$.getValue() !== undefined;
  }

  public get pending(): boolean {
    const status = this.status$.getValue();

    return status !== undefined && status.pending === true;
  }

  public get done(): boolean {
    const status = this.status$.getValue();

    return status !== undefined && isTaskDone(status);
  }

  public get error(): string | undefined {
    const status = this.status$.getValue();

    return status === undefined ? undefined : getTaskError(status);
  }

  public abort(): void {
    this.mutableAborted = true;
    const status = this.status$.getValue();
    if (status !== undefined) {
      this.status$.next({ ...status, skipped: 'Aborted' });
    }
    this.status$.complete();
  }

  public complete(): void {
    this.status$.complete();
  }

  public async run(ctx: TaskContext): Promise<void> {
    const statusIn = this.status$.getValue();
    if (statusIn === undefined) {
      this.status$.complete();

      return;
    }
    if (this.mutableAborted) {
      return;
    }

    let status = { ...statusIn, pending: true };

    const onError = (error: Error) => {
      this.taskList.onError(error, ctx);
      this.taskList.mutableSuperOnError(error);
    };

    try {
      const skip = this.skip(ctx);
      if (skip !== false) {
        status = { ...status, pending: false, skipped: skip };
        this.status$.next(status);
      } else {
        this.status$.next(status);

        // tslint:disable-next-line rxjs-finnish
        const result = this.task.task(ctx);

        let error;
        if (result instanceof Observable) {
          await result
            .pipe(
              map((message) => {
                status = { ...status, message };
                this.status$.next(status);
              }),
            )
            .toPromise();
        } else if (result instanceof Promise) {
          await result;
        } else if (result instanceof TaskList) {
          result.setSuperOnError(onError);
          // tslint:disable-next-line no-floating-promises
          result.run(ctx);
          const finalSubtasks = await result.status$
            .pipe(
              map((subtasks) => {
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
          complete: error === undefined,
          error,
        });
      }
    } catch (error) {
      this.status$.next({
        ...status,
        pending: false,
        error: error.message == undefined || error.message === '' ? 'Something went wrong.' : error.message,
      });

      onError(error);
    }

    this.status$.complete();
  }
}

export class TaskList {
  public mutableSuperOnError: (error: Error) => void;
  public readonly onError: OnErrorFn;
  private readonly tasks: ReadonlyArray<TaskWrapper>;
  private readonly concurrent: boolean;
  private readonly onComplete: () => void;
  private readonly onDone: OnDoneFn;
  private readonly initialContext: TaskContext;
  private readonly freshContext: boolean;
  private readonly statusInternal$: ReplaySubject<ReadonlyArray<TaskStatus>>;
  private mutableSubscription: Subscription | undefined;

  public constructor({
    tasks,
    concurrent,
    onError,
    onComplete,
    onDone,
    initialContext,
    freshContext,
    collapse,
  }: TaskListOptions) {
    this.tasks = tasks.map(
      (task) =>
        new TaskWrapper({
          task,
          taskList: this,
          collapse: collapse === undefined ? true : collapse,
        }),
    );

    this.concurrent = concurrent || false;
    // tslint:disable-next-line no-unused no-empty
    this.onError = onError === undefined ? (error, ctx) => {} : onError;
    // tslint:disable-next-line no-empty
    this.onComplete = onComplete === undefined ? () => {} : onComplete;
    // tslint:disable-next-line no-unused no-empty
    this.onDone = onDone === undefined ? (failed) => {} : onDone;
    this.initialContext = initialContext === undefined ? {} : initialContext;
    this.freshContext = freshContext || false;
    // tslint:disable-next-line no-unused no-empty
    this.mutableSuperOnError = (error) => {};

    this.statusInternal$ = new ReplaySubject(1);
  }

  public get status$(): Observable<ReadonlyArray<TaskStatus>> {
    this.run().catch((error) => this.onError(error, {}));

    return this.statusInternal$;
  }

  public async toPromise(): Promise<void> {
    await this.status$.toPromise();
  }

  public async abort(): Promise<void> {
    await this.abort$().toPromise();
  }

  public abort$(): Observable<ReadonlyArray<TaskStatus>> {
    this.tasks.forEach((task) => task.abort());

    return this.status$;
  }

  public setSuperOnError(onError: (error: Error) => void): void {
    this.mutableSuperOnError = onError;
  }

  public async run(ctxIn?: TaskContext): Promise<void> {
    if (this.mutableSubscription !== undefined) {
      return;
    }

    let ctx = ctxIn === undefined ? {} : ctxIn;
    if (this.freshContext) {
      ctx = {};
    }

    ctx = Object.entries(this.initialContext).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value,
      }),
      ctx,
    );
    this.checkAll(ctx);

    this.mutableSubscription = combineLatest(this.tasks.map((task) => task.status$))
      .pipe(map((statuses): ReadonlyArray<TaskStatus> => statuses.filter(utils.notNull)))
      .subscribe(this.statusInternal$);

    await this.runTasks(ctx);
    const err = getTasksError(this.tasks.map((task) => task.status$.getValue()).filter(utils.notNull));

    if (err === undefined) {
      this.onComplete();
    }
    this.onDone(err !== undefined);
  }

  private async runTasks(ctx: TaskContext): Promise<void> {
    if (this.concurrent) {
      await Promise.all(this.tasks.map(async (task) => task.run(ctx)));
    } else {
      let error: string | undefined;
      // tslint:disable-next-line no-loop-statement
      for (const task of this.tasks) {
        if (error === undefined) {
          await task.run(ctx);
        } else {
          task.complete();
        }
        error = task.error;
      }
    }
  }

  private checkAll(ctx: TaskContext): void {
    this.tasks.forEach((task) => task.check(ctx));
  }
}
