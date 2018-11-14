import { Box, Link } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { RouterLink } from '../RouterLink';
import { TypeIcon } from './TypeIcon';
import { ReferenceType } from './types';

interface Props {
  readonly title: string;
  readonly path: string;
  readonly type: ReferenceType;
}

const StyledLink = styled(Link.withComponent(RouterLink))`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaRegular')};
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  gap: 8px;
`;

export const ReferenceLink = ({ title, path, type, ...props }: Props) => (
  <Wrapper {...props}>
    <TypeIcon type={type} />
    <StyledLink to={path} linkColor="gray">
      {title}
    </StyledLink>
  </Wrapper>
);
