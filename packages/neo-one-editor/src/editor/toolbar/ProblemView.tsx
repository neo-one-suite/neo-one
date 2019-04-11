// tslint:disable no-null-keyword
import { Box, Hidden, useHidden } from '@neo-one/react-common';
import * as React from 'react';
import { FileDiagnostic, TextRange } from '../types';
import { ProblemList } from './ProblemList';
import { ProblemRoot } from './ProblemRoot';

interface Props {
  readonly path: string;
  readonly problems: ReadonlyArray<FileDiagnostic>;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

export const ProblemView = ({ problems, path, onSelectRange, ...props }: Props) => {
  const { visible, toggle } = useHidden(true);

  return (
    <Box {...props}>
      <ProblemRoot path={path} problemCount={problems.length} expanded={visible} toggle={toggle} />
      <Hidden visible={visible}>
        <ProblemList path={path} problems={problems} onSelectRange={onSelectRange} />
      </Hidden>
    </Box>
  );
};
