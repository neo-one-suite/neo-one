import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { EditorFileDisplay } from '../EditorFileDisplay';
import { EditorFile } from '../types';
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

const StyledEditorFileDisplay = styled(EditorFileDisplay)`
  color: ${prop('theme.gray0')};
`;

const StyledProblemCount = styled(ProblemCount)`
  padding-top: 1.5px;
`;

interface Props {
  readonly file: EditorFile;
  readonly problemCount: number;
  readonly expanded: boolean;
  readonly toggle: () => void;
}

export const ProblemRoot = ({ file, problemCount, expanded, toggle, ...props }: Props) => (
  <ProblemWrapper onClick={toggle} {...props}>
    {expanded ? <Expanded /> : <Collapsed />}
    <StyledEditorFileDisplay file={file} />
    <StyledProblemCount>{problemCount}</StyledProblemCount>
  </ProblemWrapper>
);
