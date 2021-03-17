import { UserAccountProvider } from '@neo-one/client-full-core';

export type CodegenFramework = 'none' | 'react' | 'angular' | 'vue';
export type CodegenLanguage = 'typescript' | 'javascript';

export interface ContractsConfiguration {
  readonly outDir: string;
  readonly path: string;
  readonly json?: boolean;
  readonly nef?: boolean;
  readonly debug?: boolean;
  readonly opcodes?: boolean;
}

export interface CodegenConfiguration {
  readonly path: string;
  readonly language: CodegenLanguage;
  readonly framework: CodegenFramework;
  readonly browserify: boolean;
  readonly codesandbox: boolean;
}

export interface NetworkConfiguration {
  readonly path: string;
  readonly port: number;
}

export interface NetworksNetworkConfiguration {
  readonly userAccountProvider: () => Promise<UserAccountProvider>;
}

export interface NetworksConfiguration {
  readonly [name: string]: NetworksNetworkConfiguration;
}

export interface NEOTrackerConfiguration {
  readonly path: string;
  readonly port: number;
  readonly skip: boolean;
}

export interface MigrationConfiguration {
  readonly path: string;
}

export interface ArtifactsConfiguration {
  readonly path: string;
}

export interface Configuration {
  readonly artifacts: ArtifactsConfiguration;
  readonly migration: MigrationConfiguration;
  readonly contracts: ContractsConfiguration;
  readonly codegen: CodegenConfiguration;
  readonly network: NetworkConfiguration;
  readonly networks: NetworksConfiguration;
  readonly neotracker: NEOTrackerConfiguration;
}
