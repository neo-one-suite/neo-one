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

export enum FindOptions {
  None = 0,
  // tslint:disable: no-bitwise
  KeysOnly = 1 << 0,
  RemovePrefix = 1 << 1,
  ValuesOnly = 1 << 2,
  DeserializeValues = 1 << 3,
  PickField0 = 1 << 4,
  PickField1 = 1 << 5,
  // tslint:enable: no-bitwise
}
