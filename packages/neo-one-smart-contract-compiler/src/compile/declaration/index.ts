import { ClassDeclarationCompiler } from './ClassDeclarationCompiler';
import { EnumDeclarationCompiler } from './EnumDeclarationCompiler';
import { EnumMemberCompiler } from './EnumMemberCompiler';
import { ExportAssignmentCompiler } from './ExportAssignmentCompiler';
import { ExportDeclarationCompiler } from './ExportDeclarationCompiler';
import { FunctionDeclarationCompiler } from './FunctionDeclarationCompiler';
import { ImportDeclarationCompiler } from './ImportDeclarationCompiler';
import { InterfaceDeclarationCompiler } from './InterfaceDeclarationCompiler';
import { TypeAliasDeclarationCompiler } from './TypeAliasDeclarationCompiler';
import { VariableDeclarationCompiler } from './VariableDeclarationCompiler';
import { VariableDeclarationListCompiler } from './VariableDeclarationListCompiler';

export default [
  ClassDeclarationCompiler,
  EnumDeclarationCompiler,
  EnumMemberCompiler,
  ExportAssignmentCompiler,
  ExportDeclarationCompiler,
  FunctionDeclarationCompiler,
  ImportDeclarationCompiler,
  InterfaceDeclarationCompiler,
  TypeAliasDeclarationCompiler,
  VariableDeclarationCompiler,
  VariableDeclarationListCompiler,
];
