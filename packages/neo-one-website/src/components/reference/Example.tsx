import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { WordTokens } from './types';
import { buildExample } from './utils';

interface Props {
  readonly example: WordTokens;
  readonly className?: string;
}

const PreWrapper = styled(Box.withComponent('pre'))`
  background-color: ${prop('theme.gray6')};
  ${prop('theme.fontStyles.subheading')};
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  padding: 16px;
  border-radius: 4px;
`;

const CodeWrapper = styled(Box.withComponent('code'))`
  ${prop('theme.fontStyles.subheading')};
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

export const Example = ({ example, className = 'language-typescript', ...props }: Props) => (
  <PreWrapper className={className} {...props}>
    <CodeWrapper className={className}>{buildExample(example)}</CodeWrapper>
  </PreWrapper>
);
