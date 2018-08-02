import { ClassDeclarationCompiler } from './ClassDeclarationCompiler';
import { EnumDeclarationCompiler } from './EnumDeclarationCompiler';
import { ExportAssignmentCompiler } from './ExportAssignmentCompiler';
import { ExportDeclarationCompiler } from './ExportDeclarationCompiler';
import { FunctionDeclarationCompiler } from './FunctionDeclarationCompiler';
import { ImportDeclarationCompiler } from './ImportDeclarationCompiler';
import { InterfaceDeclarationCompiler } from './InterfaceDeclarationCompiler';
import { TypeAliasDeclarationCompiler } from './TypeAliasDeclarationCompiler';
import { VariableDeclarationCompiler } from './VariableDeclarationCompiler';
import { VariableDeclarationListCompiler } from './VariableDeclarationListCompiler';

// tslint:disable-next-line export-name readonly-array
export const declarations = [
  ClassDeclarationCompiler,
  EnumDeclarationCompiler,
  ExportAssignmentCompiler,
  ExportDeclarationCompiler,
  FunctionDeclarationCompiler,
  ImportDeclarationCompiler,
  InterfaceDeclarationCompiler,
  TypeAliasDeclarationCompiler,
  VariableDeclarationCompiler,
  VariableDeclarationListCompiler,
];
