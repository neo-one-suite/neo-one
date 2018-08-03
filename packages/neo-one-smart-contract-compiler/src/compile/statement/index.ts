import { BlockCompiler } from './BlockCompiler';
import { BreakStatementCompiler } from './BreakStatementCompiler';
import { ContinueStatementCompiler } from './ContinueStatementCompiler';
import { DebuggerStatementCompiler } from './DebuggerStatementCompiler';
import { DoStatementCompiler } from './DoStatementCompiler';
import { EmptyStatementCompiler } from './EmptyStatementCompiler';
import { ExpressionStatementCompiler } from './ExpressionStatementCompiler';
import { ForInStatementCompiler } from './ForInStatementCompiler';
import { ForOfStatementCompiler } from './ForOfStatementCompiler';
import { ForStatementCompiler } from './ForStatementCompiler';
import { IfStatementCompiler } from './IfStatementCompiler';
import { LabeledStatementCompiler } from './LabeledStatementCompiler';
import { NotEmittedStatementCompiler } from './NotEmittedStatementCompiler';
import { ReturnStatementCompiler } from './ReturnStatementCompiler';
import { SwitchStatementCompiler } from './SwitchStatementCompiler';
import { ThrowStatementCompiler } from './ThrowStatementCompiler';
import { TryStatementCompiler } from './TryStatementCompiler';
import { VariableStatementCompiler } from './VariableStatementCompiler';
import { WhileStatementCompiler } from './WhileStatementCompiler';
import { WithStatementCompiler } from './WithStatementCompiler';

// tslint:disable-next-line export-name readonly-array
export const statements = [
  BlockCompiler,
  BreakStatementCompiler,
  ContinueStatementCompiler,
  DebuggerStatementCompiler,
  DoStatementCompiler,
  EmptyStatementCompiler,
  ExpressionStatementCompiler,
  ForInStatementCompiler,
  ForOfStatementCompiler,
  ForStatementCompiler,
  IfStatementCompiler,
  LabeledStatementCompiler,
  NotEmittedStatementCompiler,
  ReturnStatementCompiler,
  SwitchStatementCompiler,
  ThrowStatementCompiler,
  TryStatementCompiler,
  VariableStatementCompiler,
  WhileStatementCompiler,
  WithStatementCompiler,
];
