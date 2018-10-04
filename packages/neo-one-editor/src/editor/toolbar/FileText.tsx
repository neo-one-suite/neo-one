import * as nodePath from 'path';
import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  grid-auto-columns: auto;
  justify-content: start;
  align-items: end;
  grid-gap: 8px;
`;

const LightText = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  color: ${prop('theme.gray0')};
`;

const DarkText = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.caption')};
  color: ${prop('theme.gray3')};
`;

interface Props {
  readonly path: string;
}

const normalize = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

export const FileText = ({ path, ...props }: Props) => (
  <Wrapper {...props}>
    <LightText>{nodePath.basename(path)}</LightText>
    <DarkText>{normalize(nodePath.dirname(path))}</DarkText>
  </Wrapper>
);
