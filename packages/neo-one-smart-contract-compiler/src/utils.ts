// tslint:disable ban-types
import Project, { SourceFile, ts } from 'ts-simple-ast';

import appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import * as path from 'path';

// tslint:disable-next-line readonly-array
const findRoot = async (dir: string | string[], filename: string): Promise<string | undefined> => {
  let start = dir;

  if (typeof start === 'string') {
    if (start[start.length - 1] !== path.sep) {
      start += path.sep;
    }
    start = start.split(path.sep);
  }
  if (!start.length) {
    return undefined;
  }

  // tslint:disable-next-line no-array-mutation
  start.pop();
  const currentDir = start.join(path.sep);
  const file = path.join(currentDir, filename);
  const exists = await fs.pathExists(file);
  if (exists) {
    return file;
  }

  return findRoot(start, filename);
};

export const makeAst = async (dir: string): Promise<Project> => {
  const [localSCConfig, defaultConfig] = await Promise.all([
    findRoot(dir, 'tsconfig.sc.json'),
    findRoot(require.resolve('@neo-one/smart-contract-compiler'), 'tsconfig.default.json'),
  ]);
  const tsConfigFilePath = localSCConfig || defaultConfig;

  if (tsConfigFilePath === undefined) {
    throw new Error('tsconfig.json not found in path');
  }

  const res = ts.readConfigFile(tsConfigFilePath, (value) => fs.readFileSync(value, 'utf8'));
  const parseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(res.config, parseConfigHost, path.dirname(tsConfigFilePath));

  return new Project({ compilerOptions: parsed.options });
};

export const getAst = async (dir: string): Promise<Project> => {
  const ast = await makeAst(dir);
  ast.addExistingSourceFiles(path.join(dir, '**', '*.ts'));
  // For some reason this forces Ast to resolve references. Do not remove.
  ast.getPreEmitDiagnostics();

  return ast;
};

export const getAstForPath = async (filePath: string): Promise<Project> => {
  const ast = await makeAst(path.dirname(filePath));
  ast.addExistingSourceFiles(filePath);
  // For some reason this forces Ast to resolve references. Do not remove.
  ast.getPreEmitDiagnostics();

  return ast;
};

export const getAstForSnippet = async (
  code: string,
): Promise<{ readonly ast: Project; readonly sourceFile: SourceFile }> => {
  const ast = await makeAst(appRootDir.get());
  const sourceFile = ast.createSourceFile('code.ts', code);
  // For some reason this forces Ast to resolve references. Do not remove.
  ast.getPreEmitDiagnostics();

  return { ast, sourceFile };
};
