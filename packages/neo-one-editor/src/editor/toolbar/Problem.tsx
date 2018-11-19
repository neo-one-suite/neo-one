import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { MdError, MdWarning } from 'react-icons/md';
import styled, { css } from 'styled-components';
import { prop } from 'styled-tools';
import { FileDiagnostic, TextRange } from '../types';
import { ProblemWrapper } from './ProblemWrapper';

interface Props {
  readonly path: string;
  readonly problem: FileDiagnostic;
  readonly onSelectRange: (path: string, range: TextRange) => void;
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

export const Problem = ({ path, problem, onSelectRange, ...props }: Props) => (
  <Wrapper data-test={`problem-${path}`} onClick={() => onSelectRange(path, problem)} {...props}>
    {problem.severity === 'error' ? (
      <Error data-test={`problem-${path}-error`} />
    ) : (
      <Warning data-test={`problem-${path}-warning`} />
    )}
    <DarkText data-test={`problem-${path}-owner`}>{`[${problem.owner}]`}</DarkText>
    <LightText data-test={`problem-${path}-message`}>{problem.message}</LightText>
    <DarkText data-test={`problem-${path}-line`}>{`(${problem.startLineNumber}, ${problem.startColumn})`}</DarkText>
  </Wrapper>
);
