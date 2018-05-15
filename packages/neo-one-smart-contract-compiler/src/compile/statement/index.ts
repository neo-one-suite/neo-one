import { BlockCompiler } from './BlockCompiler';
import { BreakStatementCompiler } from './BreakStatementCompiler';
import { CaseBlockCompiler } from './CaseBlockCompiler';
import { CaseClauseCompiler } from './CaseClauseCompiler';
import { CatchClauseCompiler } from './CatchClauseCompiler';
import { ContinueStatementCompiler } from './ContinueStatementCompiler';
import { DebuggerStatementCompiler } from './DebuggerStatementCompiler';
import { DefaultClauseCompiler } from './DefaultClauseCompiler';
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

export default [
  BlockCompiler,
  BreakStatementCompiler,
  CaseBlockCompiler,
  CaseClauseCompiler,
  CatchClauseCompiler,
  ContinueStatementCompiler,
  DebuggerStatementCompiler,
  DefaultClauseCompiler,
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
