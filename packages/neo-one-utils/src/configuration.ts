export type CodegenFramework = 'none' | 'react' | 'angular' | 'vue';
export type CodegenLanguage = 'typescript' | 'javascript';

export interface ContractsConfiguration {
  readonly path: string;
}

export interface CodegenConfiguration {
  readonly path: string;
  readonly language: CodegenLanguage;
  readonly framework: CodegenFramework;
  readonly browserify: boolean;
}

export interface NetworkConfiguration {
  readonly path: string;
  readonly port: number;
}

export interface NEOTrackerConfiguration {
  readonly path: string;
  readonly port: number;
}

export interface Configuration {
  readonly contracts: ContractsConfiguration;
  readonly codegen: CodegenConfiguration;
  readonly network: NetworkConfiguration;
  readonly neotracker: NEOTrackerConfiguration;
}
