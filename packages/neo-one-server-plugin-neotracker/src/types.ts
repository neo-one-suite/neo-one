export interface ResetTaskListOptions {
  readonly command: 'reset';
  readonly name: string;
}

export type ExecuteTaskListOptions = ResetTaskListOptions;
