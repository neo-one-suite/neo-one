import styled from '@emotion/styled';
import { Box, FileIcon, prop } from '@neo-one/react-common';
import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { FileText } from './FileText';
import { ProblemCount } from './ProblemCount';
import { ProblemWrapper } from './ProblemWrapper';

const BaseArrow = styled(MdArrowDropDown)`
  color: ${prop('theme.gray0')};
`;

const Collapsed = styled(BaseArrow)`
  transform: translate(6px, 2px) scale(1.5) rotate(-90deg);
`;

const Expanded = styled(BaseArrow)`
  transform: translate(6px, 2px) scale(1.5) rotate(-45deg);
`;

const GridWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  gap: 4px;
  align-items: start;
`;

const StyledEditorFileIcon = styled(FileIcon)`
  height: 16px;
  width: 16px;
`;

// tslint:disable-next-line: no-any
const StyledProblemCount = styled(ProblemCount)<any>`
  padding-top: 1.5px;
`;

interface Props {
  readonly path: string;
  readonly problemCount: number;
  readonly expanded: boolean;
  readonly toggle: () => void;
}

export const ProblemRoot = ({ path, problemCount, expanded, toggle, ...props }: Props) => (
  <ProblemWrapper data-test={`problem-root-${path}`} onClick={toggle} {...props}>
    {expanded ? <Expanded /> : <Collapsed />}
    <GridWrapper {...props}>
      <StyledEditorFileIcon path={path} />
      <FileText path={path} />
    </GridWrapper>
    <StyledProblemCount data-test={`problem-root-${path}-count`}>{problemCount}</StyledProblemCount>
  </ProblemWrapper>
);
