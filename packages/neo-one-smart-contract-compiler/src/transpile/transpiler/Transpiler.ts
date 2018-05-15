// tslint:disable ban-types
import {
  ClassDeclaration,
  Node,
  Type,
  Symbol,
  ParameterDeclaration,
} from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { Libs, Globals } from '../../symbols';

export interface Transpiler {
  visit(node?: Node): void;
  addEvent(node: Node, name: string, parameters: ParameterDeclaration[]): void;
  getType(node: Node): Type | undefined;
  getSymbol(node: Node): Symbol | undefined;
  isOnlyGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean;
  isOnlyLib(node: Node, type: Type | undefined, name: keyof Libs): boolean;
  isSmartContract(node: ClassDeclaration): boolean;
  isFixedType(node: Node, type: Type | undefined): boolean;
  reportError(node: Node, message: string, code: DiagnosticCode): void;
  reportUnsupported(node: Node): void;
}
