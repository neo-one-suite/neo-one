import { Type } from 'ts-simple-ast';

import { Context } from '../Context';
import { ProgramCounter } from './pc';
import { Name } from './scope';

export interface VisitOptions {
  readonly pushValue?: boolean | undefined;
  readonly setValue?: boolean | undefined;
  readonly catchPC?: ProgramCounter | undefined;
  readonly breakPC?: ProgramCounter | undefined;
  readonly continuePC?: ProgramCounter | undefined;
  readonly switchExpressionType?: Type | undefined;
  readonly cast?: Type | undefined;
  readonly superClass?: Name | undefined;
}

export interface CompileResult {
  readonly code: Buffer;
  readonly context: Context;
}
