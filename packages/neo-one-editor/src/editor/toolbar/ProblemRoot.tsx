import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { EditorFileIcon } from '../EditorFileIcon';
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

const GridWrapper = styled(Grid)`
  grid-auto-flow: column;
  gap: 4px;
  align-items: start;
`;

const StyledEditorFileIcon = styled(EditorFileIcon)`
  height: 16px;
  width: 16px;
`;
const StyledProblemCount = styled(ProblemCount)`
  padding-top: 1.5px;
`;

interface Props {
  readonly path: string;
  readonly problemCount: number;
  readonly expanded: boolean;
  readonly toggle: () => void;
}

export const ProblemRoot = ({ path, problemCount, expanded, toggle, ...props }: Props) => (
  <ProblemWrapper onClick={toggle} {...props}>
    {expanded ? <Expanded /> : <Collapsed />}
    <GridWrapper {...props}>
      <StyledEditorFileIcon path={path} />
      <FileText path={path} />
    </GridWrapper>
    <StyledProblemCount>{problemCount}</StyledProblemCount>
  </ProblemWrapper>
);
