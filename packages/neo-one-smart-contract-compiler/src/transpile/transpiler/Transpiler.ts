import ts from 'typescript';
import { Context } from '../../Context';

export type InternalIdentifier =
  | 'getArgument'
  | 'doReturn'
  | 'trigger'
  | 'putStorage'
  | 'getStorage'
  | 'shouldSkipVerify';
export type ContractIdentifier = 'Address';

export interface Transpiler {
  readonly context: Context;
  readonly getTypeText: (node: ts.Node, type: ts.Type) => string;
  readonly getFinalTypeNode: (node: ts.Node, type: ts.Type | undefined, typeNode: ts.TypeNode) => ts.TypeNode;
  readonly getInternalIdentifier: (file: ts.Node, name: InternalIdentifier) => string;
  readonly getContractIdentifier: (file: ts.Node, name: ContractIdentifier) => string;
  readonly isSmartContract: (node: ts.ClassDeclaration) => boolean;
}
