// tslint:disable no-null-keyword
import * as React from 'react';
import { Box, Hidden } from 'reakit';
import { EditorFile, FileDiagnostic, TextRange } from '../types';
import { ProblemList } from './ProblemList';
import { ProblemRoot } from './ProblemRoot';

interface Props {
  readonly file: EditorFile;
  readonly problems: ReadonlyArray<FileDiagnostic>;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

export const ProblemView = ({ problems, file, onSelectRange, ...props }: Props) => (
  <Hidden.Container>
    {(hidden) => (
      <Box {...props}>
        <ProblemRoot file={file} problemCount={problems.length} expanded={hidden.visible} toggle={hidden.toggle} />
        <Hidden {...hidden}>
          <ProblemList file={file} problems={problems} onSelectRange={onSelectRange} />
        </Hidden>
      </Box>
    )}
  </Hidden.Container>
);
