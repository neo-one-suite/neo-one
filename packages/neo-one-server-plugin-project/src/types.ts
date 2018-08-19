import * as path from 'path';

export interface BuildTaskListOptions {
  readonly command: 'build';
  readonly rootDir: string;
  readonly javascript: boolean;
}

export type ExecuteTaskListOptions = BuildTaskListOptions;

export interface ProjectConfig {
  readonly paths: {
    readonly contracts: string;
    readonly generated: string;
  };
}

export const projectConfigSchema = {
  paths: {
    contracts: {
      format: String,
      default: path.join('one', 'contracts'),
    },
    generated: {
      format: String,
      default: path.join('one', 'generated'),
    },
  },
};
