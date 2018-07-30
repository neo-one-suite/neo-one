import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { Globals, Libs } from '../../symbols';

export interface Transpiler {
  readonly program: ts.Program;
  readonly typeChecker: ts.TypeChecker;
  readonly getType: (node: ts.Node) => ts.Type | undefined;
  readonly getSymbol: (node: ts.Node) => ts.Symbol | undefined;
  readonly getTypeText: (node: ts.Node, type: ts.Type) => string;
  readonly getFinalTypeNode: (node: ts.Node, type: ts.Type | undefined, typeNode: ts.TypeNode) => ts.TypeNode;
  readonly isOnlyGlobal: (node: ts.Node, type: ts.Type | undefined, name: keyof Globals) => boolean;
  readonly isOnlyLib: (node: ts.Node, type: ts.Type | undefined, name: keyof Libs) => boolean;
  readonly isSmartContract: (node: ts.ClassDeclaration) => boolean;
  readonly isFixedType: (node: ts.Node, type: ts.Type | undefined) => boolean;
  readonly reportError: (node: ts.Node, message: string, code: DiagnosticCode) => void;
  readonly reportUnsupported: (node: ts.Node) => void;
}
