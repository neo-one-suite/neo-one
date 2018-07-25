import ts from 'typescript';
import * as statement from './statement';
import * as utils from './utils';

export function getSourceFiles(program: ts.Program): ReadonlyArray<ts.SourceFile> {
  return program.getSourceFiles();
}

export function getSourceFile(program: ts.Program, fileName: string): ts.SourceFile | undefined {
  return utils.getValueOrUndefined(program.getSourceFile(fileName));
}

export function getSourceFileOrThrow(program: ts.Program, fileName: string): ts.SourceFile {
  return utils.throwIfNullOrUndefined(getSourceFile(program, fileName), 'source file');
}

export function isDeclarationFile(node: ts.SourceFile): boolean {
  return node.isDeclarationFile;
}

export function getFilePath(node: ts.SourceFile): string {
  return node.fileName;
}

export function getImportDeclarations(node: ts.SourceFile): ReadonlyArray<ts.ImportDeclaration> {
  return statement.getStatements(node).filter(ts.isImportDeclaration);
}

export function getExportDeclarations(node: ts.SourceFile): ReadonlyArray<ts.ExportDeclaration> {
  return statement.getStatements(node).filter(ts.isExportDeclaration);
}

export function getExportAssignments(node: ts.SourceFile): ReadonlyArray<ts.ExportAssignment> {
  return statement.getStatements(node).filter(ts.isExportAssignment);
}
