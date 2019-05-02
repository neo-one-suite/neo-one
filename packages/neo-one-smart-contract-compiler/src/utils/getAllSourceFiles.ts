import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';

const getAllSourceFilesWorker = (
  sourceFiles: readonly ts.SourceFile[],
  typeChecker: ts.TypeChecker,
  seen = new Set<ts.SourceFile>(),
): readonly ts.SourceFile[] =>
  sourceFiles.reduce<readonly ts.SourceFile[]>((acc, sourceFile) => {
    if (seen.has(sourceFile)) {
      return [];
    }
    seen.add(sourceFile);

    const importSourceFiles = tsUtils.statement
      .getStatements(sourceFile)
      .filter(ts.isImportDeclaration)
      .map((decl) => tsUtils.importExport.getModuleSpecifierSourceFile(typeChecker, decl))
      .filter(utils.notNull);
    const exportSourceFiles = tsUtils.statement
      .getStatements(sourceFile)
      .filter(ts.isExportDeclaration)
      .map((decl) => tsUtils.importExport.getModuleSpecifierSourceFile(typeChecker, decl))
      .filter(utils.notNull);
    const files = [...new Set(importSourceFiles.concat(exportSourceFiles))];

    const result = getAllSourceFilesWorker(files, typeChecker, seen);

    return acc.concat(result).concat([sourceFile]);
  }, []);

export const getAllSourceFiles = (
  sourceFiles: readonly ts.SourceFile[],
  typeChecker: ts.TypeChecker,
): Set<ts.SourceFile> => new Set(getAllSourceFilesWorker(sourceFiles, typeChecker));
