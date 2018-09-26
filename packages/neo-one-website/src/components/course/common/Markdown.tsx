import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { Markdown as MarkdownBase } from '../../../elements';

export const Markdown = styled(MarkdownBase)`
  color: ${prop('theme.gray0')};
  padding: 16px;
  margin: 0;
`;
