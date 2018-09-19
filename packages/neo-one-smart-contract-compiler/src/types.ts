import ts from 'typescript';

export interface CompilerHost {
  readonly getAllTypescriptFilesInDir: (dir: string) => Promise<ReadonlyArray<string>>;
  readonly createSnippetFile: (fileName?: string) => string;
  readonly getSmartContractPath: (file: string) => string;
  readonly getSmartContractLibPath: (file: string) => string;
  readonly createLanguageServiceHost: (
    rootNames: ReadonlyArray<string>,
    options: ts.CompilerOptions,
    withTestHarness?: boolean,
  ) => ts.LanguageServiceHost;
}
