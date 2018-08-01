import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

export interface SpecialCase {
  readonly test: (sb: ScriptBuilder, expr: ts.CallExpression, symbol: ts.Symbol) => boolean;
  readonly handle: (sb: ScriptBuilder, expr: ts.CallExpression, options: VisitOptions) => void;
}
