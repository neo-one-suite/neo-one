// tslint:disable ban-types
import { ClassDeclaration, Node, Symbol, Type } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { Globals, Libs } from '../../symbols';
import { VisitOptions } from '../types';

export interface Transpiler {
  readonly visit: (node: Node, options: VisitOptions) => void;
  readonly getType: (node: Node) => Type | undefined;
  readonly getSymbol: (node: Node) => Symbol | undefined;
  readonly getTypeText: (node: Node, type: Type) => string;
  readonly isOnlyGlobal: (node: Node, type: Type | undefined, name: keyof Globals) => boolean;
  readonly isOnlyLib: (node: Node, type: Type | undefined, name: keyof Libs) => boolean;
  readonly isSmartContract: (node: ClassDeclaration) => boolean;
  readonly isFixedType: (node: Node, type: Type | undefined) => boolean;
  readonly isSmartContractOptions: (options: VisitOptions) => VisitOptions;
  readonly reportError: (node: Node, message: string, code: DiagnosticCode) => void;
  readonly reportUnsupported: (node: Node) => void;
}
