import * as fs from 'fs-extra';
import path from 'path';
import ts from 'typescript';

const parseHost: ts.ParseConfigHost = {
  test: 'boop',
};

export function concatenate(entry: string) {
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...entry],
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName) => {
      // tslint:disable-next-line no-non-null-assertion
      if (!servicesHost.fileExists!(fileName)) {
        return undefined;
      }

      // tslint:disable-next-line no-non-null-assertion
      return ts.ScriptSnapshot.fromString(servicesHost.readFile!(fileName)!);
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => {
      const configPath = ts.findConfigFile(entry, ts.sys.fileExists);
      if (configPath === undefined) {
        return ts.getDefaultCompilerOptions();
      }
      const text = fs.readFileSync(configPath, 'utf8');
      const parseResult = ts.parseConfigFileTextToJson(configPath, text);
      const result = ts.parseJsonConfigFileContent(
        parseResult.config,
        xd,
        path.dirname(configPath),
        undefined,
        undefined,
      );
      const options = result.options;
    },
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getNewLine: () => ts.sys.newLine,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    resolveModuleNames,
  };
}
