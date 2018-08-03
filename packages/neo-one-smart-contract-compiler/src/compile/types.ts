import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { ProgramCounter } from './pc';
import { Name } from './scope';

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
}

export interface ScriptBuilderResult {
  readonly code: Buffer;
  readonly sourceMap: RawSourceMap;
}
export interface CompileResult extends ScriptBuilderResult {
  readonly context: Context;
}
