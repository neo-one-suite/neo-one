import { MethodToken } from '@neo-one/client-common';
import { ContractRegister } from '@neo-one/client-full-core';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { DebugInfo } from '../contract';
import { ProgramCounter } from './pc';
import { Name } from './scope';

export interface LinkedContracts {
  readonly [filePath: string]: {
    readonly [smartContractClass: string]: string;
  };
}

export type HandleSuperConstruct = (
  expression: ts.CallExpression,
  superExpression: ts.SuperExpression,
  options: VisitOptions,
) => void;

export interface VisitOptions {
  readonly pushValue?: boolean | undefined;
  readonly setValue?: boolean | undefined;
  readonly catchPC?: ProgramCounter | undefined;
  readonly breakPC?: ProgramCounter | undefined;
  readonly continuePC?: ProgramCounter | undefined;
  readonly finallyPC?: ProgramCounter | undefined;
  readonly switchExpressionType?: ts.Type | undefined;
  readonly cast?: ts.Type | undefined;
  readonly superClass?: Name | undefined;
  readonly handleSuperConstruct?: HandleSuperConstruct;
}

export interface ScriptBuilderResult {
  readonly code: Buffer;
  readonly sourceMap: Promise<RawSourceMap>;
  readonly tokens: ReadonlyArray<MethodToken>;
}
export interface CompileResult {
  readonly contract: ContractRegister;
  readonly context: Context;
  readonly sourceMap: Promise<RawSourceMap>;
  readonly debugInfo: DebugInfo;
}
