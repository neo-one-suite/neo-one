// tslint:disable no-null-keyword
import * as React from 'react';
import { Box, Hidden } from 'reakit';
import { FileDiagnostic, TextRange } from '../types';
import { ProblemList } from './ProblemList';
import { ProblemRoot } from './ProblemRoot';

interface Props {
  readonly path: string;
  readonly problems: ReadonlyArray<FileDiagnostic>;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

export const ProblemView = ({ problems, path, onSelectRange, ...props }: Props) => (
  <Hidden.Container>
    {(hidden) => (
      <Box {...props}>
        <ProblemRoot path={path} problemCount={problems.length} expanded={hidden.visible} toggle={hidden.toggle} />
        <Hidden {...hidden}>
          <ProblemList path={path} problems={problems} onSelectRange={onSelectRange} />
        </Hidden>
      </Box>
    )}
  </Hidden.Container>
);
