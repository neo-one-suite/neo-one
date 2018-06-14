import { ABI } from '@neo-one/client';
import Project, { SourceFile } from 'ts-simple-ast';
import { Context } from '../Context';

export interface TranspileResult {
  readonly ast: Project;
  readonly sourceFile: SourceFile;
  readonly abi: ABI;
  readonly context: Context;
}

export interface VisitOptions {
  readonly isSmartContract: boolean;
}
