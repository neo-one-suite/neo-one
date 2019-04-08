import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { StyledRouterLink } from '../StyledRouterLink';
import { TypeIcon } from './common';
import { ReferenceType } from './types';

interface Props {
  readonly title: string;
  readonly path: string;
  readonly type: ReferenceType;
}

// tslint:disable-next-line:no-any
const StyledLink: any = styled(StyledRouterLink)`
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
