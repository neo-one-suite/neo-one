import * as React from 'react';
import { Grid, styled } from 'reakit';
import { EditorFile, FileDiagnostic, TextRange } from '../types';
import { Problem } from './Problem';

const Wrapper = styled(Grid)`
  width: 100%;
`;

interface Props {
  readonly file: EditorFile;
  readonly problems: ReadonlyArray<FileDiagnostic>;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

export const ProblemList = ({ file, problems, onSelectRange, ...props }: Props) => (
  <Wrapper {...props}>
    {problems.map((problem, idx) => (
      <Problem key={idx} file={file} problem={problem} onSelectRange={onSelectRange} />
    ))}
  </Wrapper>
);
