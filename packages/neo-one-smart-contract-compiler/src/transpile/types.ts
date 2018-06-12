import Ast, { SourceFile } from 'ts-simple-ast';
import { ABI } from '@neo-one/client';
import { Context } from '../Context';

export interface TranspileResult {
  ast: Ast;
  sourceFile: SourceFile;
  abi: ABI;
  context: Context;
}

export interface VisitOptions {
  isSmartContract: boolean;
}
