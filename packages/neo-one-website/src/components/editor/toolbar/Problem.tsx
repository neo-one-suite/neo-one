import * as React from 'react';
import { MdError, MdWarning } from 'react-icons/md';
import { Box, css, styled } from 'reakit';
import { prop } from 'styled-tools';
import { EditorFile, FileDiagnostic, TextRange } from '../types';
import { ProblemWrapper } from './ProblemWrapper';

interface Props {
  readonly file: EditorFile;
  readonly problem: FileDiagnostic;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

const iconCSS = css`
  width: 12px;
  height: 12px;
  padding-top: 3.5px;
`;

const Error = styled(MdError)`
  color: ${prop('theme.error')};
  ${iconCSS};
`;

const Warning = styled(MdWarning)`
  color: ${prop('theme.warning')};
  ${iconCSS};
`;

const Wrapper = styled(ProblemWrapper)`
  align-items: center;
  padding-left: 56px;
  padding-right: 8px;
`;

const DarkText = styled(Box)`
  color: ${prop('theme.gray2')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
`;

const LightText = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const Problem = ({ file, problem, onSelectRange, ...props }: Props) => (
  <Wrapper onClick={() => onSelectRange(file, problem)} {...props}>
    {problem.severity === 'error' ? <Error /> : <Warning />}
    <DarkText>{`[${problem.owner}]`}</DarkText>
    <LightText>{problem.message}</LightText>
    <DarkText>{`(${problem.startLineNumber}, ${problem.startColumn})`}</DarkText>
  </Wrapper>
);
