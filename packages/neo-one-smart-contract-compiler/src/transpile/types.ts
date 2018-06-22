import { ABI, ContractParameterType } from '@neo-one/client';
import Project, { SourceFile } from 'ts-simple-ast';
import { Context } from '../Context';

export interface Contract {
  readonly parameters: ReadonlyArray<ContractParameterType>;
  readonly returnType: ContractParameterType;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly properties: {
    readonly storage: boolean;
    readonly dynamicInvoke: boolean;
    readonly payable: boolean;
  };
}

export interface TranspileResult {
  readonly ast: Project;
  readonly sourceFile: SourceFile;
  readonly abi: ABI;
  readonly contract: Contract;
  readonly context: Context;
}

export interface VisitOptions {
  readonly isSmartContract: boolean;
}
